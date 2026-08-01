import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Only create pool if DATABASE_URL is configured
const pool = process.env.DATABASE_URL
    ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },   // ⭐ REQUIRED for hosted Postgres
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
    : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

// Query helper
export async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database not configured - set DATABASE_URL');
  }
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get a single client for transactions if needed
export async function getClient() {
  if (!pool) {
    throw new Error('Database not configured - set DATABASE_URL');
  }
  return pool.connect();
}

// Health check
export async function healthCheck() {
  if (!pool) {
    console.warn('Database not configured (no DATABASE_URL)');
    return false;
  }
  try {
    await query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

export default pool;
