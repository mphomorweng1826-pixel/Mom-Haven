
require('dotenv').config();

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from your .env file.');
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 5
});

async function query(queryText, params = []) {
    const result = await pool.query(queryText, params);
    return result.rows;
}

module.exports = { query, pool };
