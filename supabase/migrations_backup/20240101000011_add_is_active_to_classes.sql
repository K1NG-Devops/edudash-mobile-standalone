-- Add is_active column to classes table
ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to students table if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add is_active column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for better performance on is_active queries
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Update existing records to be active by default
UPDATE classes SET is_active = true WHERE is_active IS NULL;
UPDATE students SET is_active = true WHERE is_active IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;
