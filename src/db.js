// db.js — helper-only module

export async function query(pool, text, params = []) {
  return pool.query(text, params);
}

export async function getClient(pool) {
  return pool.connect();
}

export async function healthCheck(pool) {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch {
    return false;
  }
}
