-- Add file_url column to tasks table for lecturer task attachments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);

