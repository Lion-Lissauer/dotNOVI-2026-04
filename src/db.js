import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Build pool configuration safely
function createPool() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('DATABASE_URL is not set. Database features will be disabled.');
    return null;
  }

  return new Pool({
    connectionString: url,
    ssl: false, // IMPORTANT: disable SSL for local/Docker Postgres
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

const pool = createPool();

// Ensure required tables exist
async function ensureSchema() {
  if (!pool) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
                                         id SERIAL PRIMARY KEY,
                                         text TEXT NOT NULL,
                                         created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    console.log('Database schema ensured.');
  } catch (err) {
    console.error('Failed to ensure schema:', err);
  }
}

// Kick off schema creation (non-blocking)
ensureSchema().catch((err) => {
  console.error('Schema initialization error:', err);
});

// Log unexpected idle errors
if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client:', err);
  });
}

// Query helper
export async function query(text, params = []) {
  if (!pool) {
    console.warn('Query attempted without a configured database.');
    throw new Error('Database not configured');
  }

  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Get a client for transactions
export async function getClient() {
  if (!pool) {
    throw new Error('Database not configured');
  }
  return pool.connect();
}

// Health check — never throws, never crashes the app
export async function healthCheck() {
  if (!pool) {
    console.warn('Health check: DATABASE_URL missing.');
    return false;
  }

  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.warn('Health check failed:', error.message);
    return false;
  }
}

export default pool;
