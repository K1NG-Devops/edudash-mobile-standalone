-- Add icon_url column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS icon_url TEXT;
