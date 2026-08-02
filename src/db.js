import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;
const { Pool } = pg;

// Wait for Postgres to become ready
async function waitForPostgres() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('DATABASE_URL is not set.');
    return;
  }

  const testPool = new Pool({
    connectionString: url,
    ssl: false,
  });

  for (let i = 0; i < 20; i++) {
    try {
      await testPool.query('SELECT 1');
      console.log('Postgres is ready.');
      await testPool.end();
      return;
    } catch (err) {
      console.log('Postgres not ready yet, retrying...');
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  console.error('Postgres did not become ready in time.');
}

// Create pool AFTER Postgres is ready
function createPool() {
  const url = process.env.DATABASE_URL;

  return new Pool({
    connectionString: url,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// Ensure required tables exist
async function ensureSchema() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
                                         id SERIAL PRIMARY KEY,
                                         title TEXT NOT NULL,
                                         content TEXT NOT NULL,
                                         created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        );
    `);

    console.log('Database schema ensured.');
  } catch (err) {
    console.error('Failed to ensure schema:', err);
  }
}

// Startup sequence
await waitForPostgres();
pool = createPool();
await ensureSchema();

// Query helper
export async function query(text, params = []) {
  return pool.query(text, params);
}

export default pool;
