// src/db.js
//---------------------------------------------------------
// Central place for PostgreSQL access
//---------------------------------------------------------

// 1) Load environment variables (DATABASE_URL, etc.)
require('dotenv').config();

// 2) Pull the Pool class out of the 'pg' library
const { Pool } = require('pg');

// 3) Create ONE connection-pool for the entire app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you later deploy to a cloud service that requires SSL,
  // you can turn this on conditionally:
  // ssl: { rejectUnauthorized: false },
});

// 4) Export a tiny helper so other files can do:
//    const db = require('./db');
//    const rows = await db.query('SELECT * FROM students');
module.exports.query = (text, params) => pool.query(text, params);
