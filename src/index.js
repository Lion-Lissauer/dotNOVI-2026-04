import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './db-init.js';
import healthRoutes from './routes/health.js';
import notesRoutes from './routes/notes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.use('/health', healthRoutes);
app.use('/api/notes', notesRoutes);

// Simple health check
app.get('/health/simple', (req, res) => {
  res.status(200).send('OK');
});

// Debug environment endpoint
app.get('/debug/env', (req, res) => {
  res.json({
    DATABASE_URL: process.env.DATABASE_URL || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  });
});

// Home page
app.get('/', async (req, res) => {
  try {
    const result = await req.app.locals.db.query(
        'SELECT id, title, content, created_at FROM notes ORDER BY created_at DESC'
    );
    res.render('index', { notes: result.rows });
  } catch (error) {
    console.error('Error rendering home page:', error.message);
    res.render('index', { notes: [], error: 'Failed to load notes' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ⭐ EXPORT THE APP FOR TESTS
export default app;

// ⭐ ONLY START SERVER IN NON-TEST ENVIRONMENTS
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      const pool = await initDatabase();
      app.locals.db = pool;

      const server = app.listen(PORT, () => {
        console.log(`dotNOVI listening on port ${PORT}`);
      });

      process.on('SIGTERM', () => {
        server.close(() => process.exit(0));
      });

    } catch (err) {
      console.error('Fatal startup error:', err);
      process.exit(1);
    }
  })();
}
