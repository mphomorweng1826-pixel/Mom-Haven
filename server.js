
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const path = require('path');

require('dotenv').config();

const { query } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;


// =====================================================
// CHECK SESSION SECRET
// =====================================================

if (!process.env.SESSION_SECRET) {
    console.error('Error: SESSION_SECRET is missing from your .env file.');
    process.exit(1);
}


// =====================================================
// SECURITY AND REQUEST HANDLING
// =====================================================

app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// =====================================================
// SESSION CONFIGURATION
// =====================================================

app.use(session({
    name: 'momsHaven.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 2
    }
}));


// =====================================================
// RATE LIMITERS
// =====================================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.'
    }
});

const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset requests. Please try again later.'
    }
});

const resetPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again later.'
    }
});


// =====================================================
// CHECK WHETHER A USER IS LOGGED IN
// =====================================================

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }

    next();
}


// =====================================================
// API STATUS
// =====================================================

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        message: "Mom's Haven server is running!"
    });
});


// =====================================================
// USER REGISTRATION
// =====================================================

app.post('/api/register', async (req, res) => {
    try {
        const fullName = String(req.body.fullName || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = req.body.password;

        if (!fullName || !email || typeof password !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Please complete all the required fields.'
            });
        }

        if (fullName.length > 150 || email.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Your name or email address is too long.'
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({
                success: false,
                message: 'Your password must be at least 8 characters and no more than 72 bytes.'
            });
        }

        const existingUsers = await query(
            'SELECT UserID FROM dbo.Users WHERE Email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await query(
            `INSERT INTO dbo.Users (FullName, Email, PasswordHash)
             VALUES (?, ?, ?)`,
            [fullName, email, passwordHash]
        );

        return res.status(201).json({
            success: true,
            message: 'Your account has been created successfully!'
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (/2627|2601|duplicate|unique/i.test(error.message || '')) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'A server error occurred during registration. Please try again.'
        });
    }
});


// =====================================================
// FORGOT PASSWORD
// =====================================================

app.post('/api/forgot-password', forgotPasswordLimiter, async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid email address.'
            });
        }

        const users = await query(
            'SELECT UserID FROM dbo.Users WHERE Email = ?',
            [email]
        );

        // Do not reveal whether an account exists.
        if (users.length === 0) {
            return res.json({
                success: true,
                message: 'If an account exists, a password reset link has been generated.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const expiry = new Date(Date.now() + 15 * 60 * 1000);

        await query(
            `UPDATE dbo.Users
             SET ResetTokenHash = ?,
                 ResetTokenExpiry = ?
             WHERE UserID = ?`,
            [tokenHash, expiry, users[0].UserID]
        );

        // Development-only link. This does not send an email.
        const resetLink =
            `http://localhost:${PORT}/reset-password.html?token=${resetToken}`;

        return res.json({
            success: true,
            message: 'Your password reset link has been generated. It expires in 15 minutes.',
            resetLink: resetLink
        });

    } catch (error) {
        console.error('Forgot password error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to process your request. Please try again.'
        });
    }
});


// =====================================================
// RESET PASSWORD
// =====================================================

app.post('/api/reset-password', resetPasswordLimiter, async (req, res) => {
    try {
        const token = String(req.body.token || '');
        const password = req.body.password;

        if (!/^[a-f0-9]{64}$/.test(token)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset link.'
            });
        }

        if (
            typeof password !== 'string' ||
            password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters and no more than 72 bytes.'
            });
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const users = await query(
            `SELECT UserID
             FROM dbo.Users
             WHERE ResetTokenHash = ?
               AND ResetTokenExpiry > SYSUTCDATETIME()`,
            [tokenHash]
        );

        if (!users || users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'This reset link is invalid or has expired. Please request another one.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await query(
            `UPDATE dbo.Users
             SET PasswordHash = ?,
                 ResetTokenHash = NULL,
                 ResetTokenExpiry = NULL
             WHERE UserID = ?
               AND ResetTokenHash = ?
               AND ResetTokenExpiry > SYSUTCDATETIME()`,
            [passwordHash, users[0].UserID, tokenHash]
        );

        const remainingTokens = await query(
            `SELECT UserID
             FROM dbo.Users
             WHERE UserID = ?
               AND ResetTokenHash = ?`,
            [users[0].UserID, tokenHash]
        );

        if (remainingTokens.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'The reset link could not be used. Please request another one.'
            });
        }

        return res.json({
            success: true,
            message: 'Your password has been changed successfully. You can now log in.'
        });

    } catch (error) {
        console.error('Reset password error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to reset your password. Please try again.'
        });
    }
});


// =====================================================
// USER LOGIN
// =====================================================

app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        const password = req.body.password;

        if (!email || typeof password !== 'string' || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please enter your email address and password.'
            });
        }

        const users = await query(
            `SELECT UserID, FullName, Email, PasswordHash, UserRole
             FROM dbo.Users
             WHERE Email = ?`,
            [email]
        );

        if (!users || users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect email address or password.'
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.PasswordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect email address or password.'
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error('Session error:', error);

                return res.status(500).json({
                    success: false,
                    message: 'Unable to complete login. Please try again.'
                });
            }

            req.session.user = {
                userID: user.UserID,
                fullName: user.FullName,
                email: user.Email,
                role: user.UserRole
            };

            req.session.save((saveError) => {
                if (saveError) {
                    console.error('Session save error:', saveError);

                    return res.status(500).json({
                        success: false,
                        message: 'Unable to complete login. Please try again.'
                    });
                }

                return res.json({
                    success: true,
                    message: 'Login successful!'
                });
            });
        });

    } catch (error) {
        console.error('Login error:', error);

        return res.status(500).json({
            success: false,
            message: 'A server error occurred. Please try again.'
        });
    }
});


// =====================================================
// GET CURRENTLY LOGGED-IN USER
// =====================================================

app.get('/api/me', requireAuth, (req, res) => {
    res.json({
        user: req.session.user
    });
});


// =====================================================
// USER LOGOUT
// =====================================================

app.post('/api/logout', requireAuth, (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Logout error:', error);

            return res.status(500).json({
                success: false,
                message: 'Unable to log out. Please try again.'
            });
        }

        res.clearCookie('momsHaven.sid');

        return res.json({
            success: true,
            message: 'You have been logged out.'
        });
    });
});


// =====================================================
// DISPLAY REGISTRATION PAGE
// =====================================================

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});


// =====================================================
// PROTECT HOME PAGE
// =====================================================

app.get('/home.html', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});


// =====================================================
// PREVENT ACCESS TO BACKEND CONFIGURATION FILES
// =====================================================

const privateFiles = [
    '/server.js',
    '/db.js',
    '/package.json',
    '/package-lock.json',
    '/.env',
    '/test-db.js',
    '/test-odbc.js'
];

app.use((req, res, next) => {
    if (privateFiles.includes(req.path)) {
        return res.sendStatus(404);
    }

    next();
});


// =====================================================
// API NOT FOUND HANDLER
// =====================================================

// Ensure unknown API requests return JSON, not an HTML page.
app.use('/api', (req, res) => {
    return res.status(404).json({
        success: false,
        message: 'API endpoint not found.'
    });
});


// =====================================================
// SERVE WEBSITE FRONTEND FILES
// =====================================================

app.use(express.static(__dirname, {
    index: false,
    dotfiles: 'deny'
}));


// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(`Mom's Haven server is running at http://localhost:${PORT}`);
});
