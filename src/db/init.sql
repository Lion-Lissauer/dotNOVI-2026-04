-- Create notes table for dotNOVI application
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Insert sample data
INSERT INTO notes (title, content) VALUES
  ('Welcome to dotNOVI', 'This is a simple note-taking application built for Dockerfile Hogeschool DevOps course.'),
  ('DevOps Introduction', 'DevOps is a set of practices that combines software development and IT operations.')
ON CONFLICT DO NOTHING;
