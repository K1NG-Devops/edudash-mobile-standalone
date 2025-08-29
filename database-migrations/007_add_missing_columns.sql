-- Add missing columns to existing tables
-- This migration adds columns that are referenced in the codebase but missing from the database

-- Add password_reset_required to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;

-- Add avatar_url to students table  
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add preview column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS preview TEXT;

-- Add is_read column to messages table if not exists
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Add subject column to messages table if not exists  
ALTER TABLE messages ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add sent_at column to messages table if not exists
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;

-- Add priority column to messages table if not exists
ALTER TABLE messages ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Create student_enrollments table if it doesn't exist
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Create attendance_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'sick')),
  arrival_time TIME,
  departure_time TIME,
  notes TEXT,
  attendance_rate DECIMAL(5,2) DEFAULT 100.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, attendance_date)
);

-- Create activity_progress table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_spent_minutes INTEGER,
  attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, activity_id)
);

-- Create assignment_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  homework_assignment_id UUID NOT NULL REFERENCES homework_assignments(id) ON DELETE CASCADE,
  submission_text TEXT,
  attachment_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded', 'returned')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  grade TEXT,
  teacher_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, homework_assignment_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON student_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_activity_progress_student_id ON activity_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_progress_activity_id ON activity_progress(activity_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_homework_id ON assignment_submissions(homework_assignment_id);

-- Enable RLS on new tables
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_enrollments
CREATE POLICY student_enrollments_select_policy ON student_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.id = student_id 
        AND (s.parent_id = auth.uid()::uuid OR EXISTS (
          SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
            AND u.preschool_id = s.preschool_id 
            AND u.role IN ('teacher', 'admin', 'principal')
        ))
    )
  );

-- RLS policies for attendance_records
CREATE POLICY attendance_records_select_policy ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.id = student_id 
        AND (s.parent_id = auth.uid()::uuid OR EXISTS (
          SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
            AND u.preschool_id = s.preschool_id 
            AND u.role IN ('teacher', 'admin', 'principal')
        ))
    )
  );

-- RLS policies for activity_progress
CREATE POLICY activity_progress_select_policy ON activity_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.id = student_id 
        AND (s.parent_id = auth.uid()::uuid OR EXISTS (
          SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
            AND u.preschool_id = s.preschool_id 
            AND u.role IN ('teacher', 'admin', 'principal')
        ))
    )
  );

-- RLS policies for assignment_submissions
CREATE POLICY assignment_submissions_select_policy ON assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s 
      WHERE s.id = student_id 
        AND (s.parent_id = auth.uid()::uuid OR EXISTS (
          SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
            AND u.preschool_id = s.preschool_id 
            AND u.role IN ('teacher', 'admin', 'principal')
        ))
    )
  );

-- Add insert/update/delete policies for teachers and admins
CREATE POLICY student_enrollments_insert_policy ON student_enrollments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
        AND u.role IN ('teacher', 'admin', 'principal')
        AND EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.preschool_id = u.preschool_id)
    )
  );

CREATE POLICY attendance_records_insert_policy ON attendance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
        AND u.role IN ('teacher', 'admin', 'principal')
        AND EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.preschool_id = u.preschool_id)
    )
  );

CREATE POLICY activity_progress_insert_policy ON activity_progress
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid()::uuid 
        AND (u.role IN ('teacher', 'admin', 'principal') OR EXISTS (
          SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = u.id
        ))
    )
  );

CREATE POLICY assignment_submissions_insert_policy ON assignment_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()::uuid
    )
  );

-- Update assignment_submissions update policy for teachers to grade
CREATE POLICY assignment_submissions_update_policy ON assignment_submissions
  FOR UPDATE USING (
    -- Parents can update their own child's submissions
    EXISTS (SELECT 1 FROM students s WHERE s.id = student_id AND s.parent_id = auth.uid()::uuid)
    OR
    -- Teachers can update (grade) submissions for their students
    EXISTS (
      SELECT 1 FROM users u 
      JOIN students s ON s.preschool_id = u.preschool_id
      WHERE u.id = auth.uid()::uuid 
        AND u.role IN ('teacher', 'admin', 'principal')
        AND s.id = student_id
    )
  );

COMMENT ON COLUMN users.password_reset_required IS 'Flag indicating if user must reset password on next login';
COMMENT ON COLUMN students.avatar_url IS 'URL to student profile picture/avatar';
COMMENT ON COLUMN messages.preview IS 'Short preview text for message listings';
COMMENT ON TABLE student_enrollments IS 'Tracks which students are enrolled in which classes';
COMMENT ON TABLE attendance_records IS 'Daily attendance tracking for students';
COMMENT ON TABLE activity_progress IS 'Tracks student progress on learning activities';
COMMENT ON TABLE assignment_submissions IS 'Student homework submissions and grading';
