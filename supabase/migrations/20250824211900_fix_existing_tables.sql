-- Add missing columns to existing tables that already exist but are missing columns

-- Fix assignment_submissions table - add missing columns
DO $$ 
BEGIN
  -- Add assignment_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'assignment_id') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "assignment_id" uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
  
  -- Add student_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'student_id') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "student_id" uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
  
  -- Add submitted_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'submitted_at') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "submitted_at" timestamp with time zone DEFAULT now();
  END IF;
  
  -- Add file_urls if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'file_urls') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "file_urls" text[];
  END IF;
  
  -- Add grade if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'grade') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "grade" numeric;
  END IF;
  
  -- Add feedback if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'feedback') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "feedback" text;
  END IF;
  
  -- Add status if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'status') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "status" varchar(20) DEFAULT 'submitted';
  END IF;
  
  -- Add attachment_urls if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignment_submissions' AND column_name = 'attachment_urls') THEN
    ALTER TABLE "public"."assignment_submissions" ADD COLUMN "attachment_urls" text[];
  END IF;
END $$;

-- Add missing columns to activity_progress table if it exists but missing columns
DO $$ 
BEGIN
  -- Add activity_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_progress' AND column_name = 'activity_id') THEN
    ALTER TABLE "public"."activity_progress" ADD COLUMN "activity_id" uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
  
  -- Add student_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_progress' AND column_name = 'student_id') THEN
    ALTER TABLE "public"."activity_progress" ADD COLUMN "student_id" uuid NOT NULL DEFAULT gen_random_uuid();
  END IF;
  
  -- Add score if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_progress' AND column_name = 'score') THEN
    ALTER TABLE "public"."activity_progress" ADD COLUMN "score" numeric;
  END IF;
  
  -- Add completed_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_progress' AND column_name = 'completed_at') THEN
    ALTER TABLE "public"."activity_progress" ADD COLUMN "completed_at" timestamp with time zone;
  END IF;
  
  -- Add attempts if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_progress' AND column_name = 'attempts') THEN
    ALTER TABLE "public"."activity_progress" ADD COLUMN "attempts" integer DEFAULT 1;
  END IF;
  
  -- Add time_spent_minutes if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activity_progress' AND column_name = 'time_spent_minutes') THEN
    ALTER TABLE "public"."activity_progress" ADD COLUMN "time_spent_minutes" integer;
  END IF;
END $$;

-- Now add foreign key constraints conditionally
DO $$
BEGIN
  -- Foreign keys for assignment_submissions
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assignment_submissions_assignment_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homework_assignments') THEN
      ALTER TABLE "public"."assignment_submissions" 
      ADD CONSTRAINT "assignment_submissions_assignment_id_fkey" 
      FOREIGN KEY ("assignment_id") REFERENCES "public"."homework_assignments"("id") ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assignment_submissions_student_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
      ALTER TABLE "public"."assignment_submissions" 
      ADD CONSTRAINT "assignment_submissions_student_id_fkey" 
      FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Foreign keys for activity_progress
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'activity_progress_activity_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
      ALTER TABLE "public"."activity_progress" 
      ADD CONSTRAINT "activity_progress_activity_id_fkey" 
      FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;
    END IF;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'activity_progress_student_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
      ALTER TABLE "public"."activity_progress" 
      ADD CONSTRAINT "activity_progress_student_id_fkey" 
      FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
