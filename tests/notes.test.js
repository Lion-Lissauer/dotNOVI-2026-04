import { jest } from '@jest/globals';
import request from 'supertest';

// Create a mock database pool
const mockDb = {
  query: jest.fn()
};

// Import the app AFTER defining the mock
const { default: app } = await import('../src/index.js');

// Inject mock DB into the app
app.locals.db = mockDb;

describe('Notes API', () => {
  beforeEach(() => {
    mockDb.query.mockReset();
  });

  describe('GET /api/notes', () => {
    it('should return an array of notes', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
          .get('/api/notes')
          .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return notes with required fields', async () => {
      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            title: 'Test',
            content: 'Content',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });

      const response = await request(app)
          .get('/api/notes')
          .expect(200);

      if (response.body.length > 0) {
        const note = response.body[0];
        expect(note).toHaveProperty('id');
        expect(note).toHaveProperty('title');
        expect(note).toHaveProperty('content');
        expect(note).toHaveProperty('created_at');
      }
    });
  });

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const newNote = {
        title: 'Test Note',
        content: 'This is a test note'
      };

      mockDb.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            ...newNote,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });

      const response = await request(app)
          .post('/api/notes')
          .send(newNote)
          .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newNote.title);
      expect(response.body.content).toBe(newNote.content);
    });

    it('should require title and content', async () => {
      const response = await request(app)
          .post('/api/notes')
          .send({ title: 'Test' })
          .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject empty title', async () => {
      const response = await request(app)
          .post('/api/notes')
          .send({ title: '', content: 'Content' })
          .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/notes/:id', () => {
    it('should return 404 for non-existent note', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
          .get('/api/notes/99999')
          .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/notes/:id', () => {
    it('should require title and content for update', async () => {
      const response = await request(app)
          .put('/api/notes/1')
          .send({ title: 'Test' })
          .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 for non-existent note', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
          .put('/api/notes/99999')
          .send({ title: 'Test', content: 'Test' })
          .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/notes/:id', () => {
    it('should return 404 for non-existent note', async () => {
      mockDb.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
          .delete('/api/notes/99999')
          .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
          .get('/api/invalid')
          .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
