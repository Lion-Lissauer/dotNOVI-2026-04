import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export async function initDatabase() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.warn('DATABASE_URL is not set.');
    return null;
  }

  // Temporary pool for readiness check
  const testPool = new Pool({
    connectionString: url,
    ssl: false,
  });

  // Wait for Postgres
  for (let i = 0; i < 20; i++) {
    try {
      await testPool.query('SELECT 1');
      console.log('Postgres is ready.');
      await testPool.end();
      break;
    } catch {
      console.log('Postgres not ready yet, retrying...');
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  // Create real pool
  const pool = new Pool({
    connectionString: url,
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Ensure schema
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

  return pool;
}
