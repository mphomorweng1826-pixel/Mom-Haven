
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
const isProduction = process.env.NODE_ENV === 'production';

// =====================================================
// CHECK CONFIGURATION
// =====================================================

if (!process.env.SESSION_SECRET) {
    console.error('Error: SESSION_SECRET is missing.');
    process.exit(1);
}

if (isProduction && !process.env.FRONTEND_URL) {
    console.error('Error: FRONTEND_URL is missing.');
    process.exit(1);
}

// =====================================================
// PROXY CONFIGURATION
// =====================================================

if (isProduction) {
    app.set('trust proxy', 1);
}

// =====================================================
// CORS CONFIGURATION
// =====================================================

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigin = process.env.FRONTEND_URL;

    const originAllowed = isProduction
        ? origin === allowedOrigin
        : true;

    if (origin && originAllowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type'
        );
        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, OPTIONS'
        );
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

// =====================================================
// SECURITY AND REQUEST HANDLING
// =====================================================

app.use(helmet({
    contentSecurityPolicy: false
}));

app.use(express.json({ limit: '100kb' }));
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
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// IMPORTANT:
// The default MemoryStore is suitable only for local testing.
// Persistent session storage must be configured before deployment.

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
// AUTHENTICATION MIDDLEWARE
// =====================================================

function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Please log in to continue.'
        });
    }

    next();
}

// =====================================================
// HOME PAGE
// =====================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
                message: 'Please complete all required fields.'
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

        if (
            password.length < 8 ||
            Buffer.byteLength(password, 'utf8') > 72
        ) {
            return res.status(400).json({
                success: false,
                message: 'Your password must be at least 8 characters and no more than 72 bytes.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await query(
            `INSERT INTO public.users
                (full_name, email, password_hash)
             VALUES ($1, $2, $3)`,
            [fullName, email, passwordHash]
        );

        return res.status(201).json({
            success: true,
            message: 'Your account has been created successfully!'
        });

    } catch (error) {
        console.error('Registration error:', error);

        if (error.code === '23505') {
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
            `SELECT user_id
             FROM public.users
             WHERE email = $1`,
            [email]
        );

        if (users.length === 0) {
            return res.json({
                success: true,
                message: 'If an account exists, password reset instructions will be provided.'
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');

        const tokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        await query(
            `UPDATE public.users
             SET reset_token_hash = $1,
                 reset_token_expiry = NOW() + INTERVAL '15 minutes'
             WHERE user_id = $2`,
            [tokenHash, users[0].user_id]
        );

        if (!isProduction) {
            const baseUrl = process.env.BASE_URL ||
                `http://localhost:${PORT}`;

            return res.json({
                success: true,
                message: 'Development reset link generated.',
                resetLink: `${baseUrl}/reset-password.html?token=${resetToken}`
            });
        }

        // Email delivery has not yet been configured.
        return res.status(503).json({
            success: false,
            message: 'Password reset email delivery has not yet been configured.'
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

        const passwordHash = await bcrypt.hash(password, 12);

        const updatedUsers = await query(
            `UPDATE public.users
             SET password_hash = $1,
                 reset_token_hash = NULL,
                 reset_token_expiry = NULL
             WHERE reset_token_hash = $2
               AND reset_token_expiry > NOW()
             RETURNING user_id`,
            [passwordHash, tokenHash]
        );

        if (updatedUsers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'This reset link is invalid or has expired. Please request another one.'
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
            `SELECT
                user_id AS "UserID",
                full_name AS "FullName",
                email AS "Email",
                password_hash AS "PasswordHash",
                user_role AS "UserRole"
             FROM public.users
             WHERE email = $1`,
            [email]
        );

        if (users.length === 0) {
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
        success: true,
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

        res.clearCookie('momsHaven.sid', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });

        return res.json({
            success: true,
            message: 'You have been logged out.'
        });
    });
});

// =====================================================
// COMMUNITY STORIES - GET PUBLIC STORIES
// =====================================================

app.get('/api/community-stories', async (req, res) => {
    try {
        const stories = await query(
            `SELECT
                story_id,
                author_name,
                city,
                journey,
                experience,
                created_at
             FROM public.community_stories
             WHERE status = 'approved'
             ORDER BY created_at DESC`
        );

        return res.json({
            success: true,
            stories
        });

    } catch (error) {
        console.error('Load community stories error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to load community stories.'
        });
    }
});

// =====================================================
// COMMUNITY STORIES - SUBMIT STORY
// =====================================================

app.post('/api/community-stories', requireAuth, async (req, res) => {
    try {
        const city = String(req.body.city || '').trim();
        const journey = String(req.body.journey || '').trim();
        const experience = String(req.body.experience || '').trim();

        const userID = req.session.user.userID;
        const authorName = req.session.user.fullName;

        if (!experience) {
            return res.status(400).json({
                success: false,
                message: 'Please share your experience.'
            });
        }

        if (experience.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Your experience must be 5,000 characters or fewer.'
            });
        }

        if (city.length > 100 || journey.length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Please check the length of your details.'
            });
        }

        const result = await query(
            `INSERT INTO public.community_stories
                (user_id, author_name, city, journey, experience, status)
             VALUES ($1, $2, $3, $4, $5, 'approved')
             RETURNING
                story_id,
                author_name,
                city,
                journey,
                experience,
                created_at`,
            [
                userID,
                authorName,
                city || null,
                journey || null,
                experience
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Your experience has been shared successfully.',
            story: result[0]
        });

    } catch (error) {
        console.error('Submit community story error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to share your experience. Please try again.'
        });
    }
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

app.get('/home.html', (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login.html');
    }

    res.sendFile(path.join(__dirname, 'home.html'), next);
});

// =====================================================
// PREVENT ACCESS TO BACKEND FILES
// =====================================================

const privateFiles = [
    '/server.js',
    '/db.js',
    '/package.json',
    '/package-lock.json',
    '/.env',
    '/.env.example',
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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mom's Haven server is running on port ${PORT}`);
});
