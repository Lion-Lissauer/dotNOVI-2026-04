import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Simple DB check
    const dbStatus = await req.app.locals.db
        .query('SELECT NOW()')
        .then(() => 'healthy')
        .catch(() => 'unavailable');

    res.json({
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
    });
  } catch (error) {
    console.error('Health check error:', error);

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'unavailable',
    });
  }
});

export default router;
