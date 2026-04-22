const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('localhost') ? false : {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false,
  keepAlive: true,
  statement_timeout: 60000 // 1 minute timeout for safer pool management
});

pool.on('connect', () => {
  const host = connectionString ? new URL(connectionString).hostname : 'unknown';
  console.log(`Connected to PostgreSQL database at ${host}`);
});

// Resiliency: Logging idle errors instead of crashing the process
pool.on('error', (err) => {
  console.error('Database Pool Warning (Idle Client Reset):', err.message);
  // Do not call process.exit. pg-pool will recover by removing the client.
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
