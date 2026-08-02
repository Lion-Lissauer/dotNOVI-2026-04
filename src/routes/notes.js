import express from 'express';

const router = express.Router();

/**
 * GET /api/notes
 * Retrieve all notes
 */
router.get('/', async (req, res) => {
  try {
    const result = await req.app.locals.db.query(
        'SELECT id, title, content, created_at, updated_at FROM notes ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

/**
 * GET /api/notes/:id
 * Retrieve a specific note by ID
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await req.app.locals.db.query(
        'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = $1',
        [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const result = await req.app.locals.db.query(
        'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at, updated_at',
        [title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

/**
 * PUT /api/notes/:id
 * Update an existing note
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const checkResult = await req.app.locals.db.query(
        'SELECT id FROM notes WHERE id = $1',
        [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const result = await req.app.locals.db.query(
        'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, title, content, created_at, updated_at',
        [title, content, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await req.app.locals.db.query(
        'DELETE FROM notes WHERE id = $1 RETURNING id',
        [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
