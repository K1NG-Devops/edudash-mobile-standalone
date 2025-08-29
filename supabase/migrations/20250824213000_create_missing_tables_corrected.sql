-- Create missing tables for EduDash Pro (corrected version)

-- Create classroom_reports table
CREATE TABLE IF NOT EXISTS "public"."classroom_reports" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "preschool_id" uuid NOT NULL,
  "teacher_id" uuid NOT NULL, 
  "student_id" uuid NOT NULL,
  "class_id" uuid,
  "report_type" varchar(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly')),
  "report_date" date NOT NULL,
  
  -- Activity Summary
  "activities_summary" jsonb,
  "total_activities" integer DEFAULT 0,
  
  -- Behavioral Observations
  "behavior_notes" text,
  "mood_rating" integer CHECK (mood_rating BETWEEN 1 AND 5),
  "participation_level" varchar(20) CHECK (participation_level IN ('low', 'moderate', 'high', 'excellent')),
  "social_interactions" text,
  
  -- Learning Progress
  "learning_highlights" text,
  "skills_developed" text[],
  "areas_for_improvement" text,
  "achievement_badges" text[],
  
  -- Daily Care
  "meals_eaten" text[],
  "nap_time_start" time,
  "nap_time_end" time,
  "diaper_changes" integer DEFAULT 0,
  "bathroom_visits" integer DEFAULT 0,
  
  -- Health & Wellness
  "health_observations" text,
  "incidents" text,
  "medications_given" text[],
  "temperature_checks" jsonb,
  
  -- Parent Communication
  "parent_message" text,
  "follow_up_needed" boolean DEFAULT false,
  "next_steps" text,
  
  -- Media & Photos
  "media_highlights" text[],
  "photo_count" integer DEFAULT 0,
  
  -- Status
  "is_sent_to_parents" boolean DEFAULT false,
  "sent_at" timestamp with time zone,
  "parent_viewed_at" timestamp with time zone,
  "parent_acknowledgment" text,
  
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  
  CONSTRAINT "classroom_reports_pkey" PRIMARY KEY ("id")
);

-- Create billing_cycles table
CREATE TABLE IF NOT EXISTS "public"."billing_cycles" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "preschool_id" uuid NOT NULL,
  "subscription_plan_id" uuid,
  "billing_period" varchar(20) NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  "cycle_start" date NOT NULL,
  "cycle_end" date NOT NULL,
  "amount" decimal(10,2) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
  "auto_renew" boolean DEFAULT true,
  "next_billing_date" date,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  
  CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);

-- Create assessment_rubrics table
CREATE TABLE IF NOT EXISTS "public"."assessment_rubrics" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "preschool_id" uuid NOT NULL,
  "created_by" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "description" text,
  "age_group_id" uuid,
  "subject_area" varchar(100),
  "criteria" jsonb NOT NULL, -- Array of assessment criteria
  "scoring_scale" jsonb NOT NULL, -- Scoring scale definition
  "is_active" boolean DEFAULT true,
  "is_template" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  
  CONSTRAINT "assessment_rubrics_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
DO $$
BEGIN
  -- Foreign keys for classroom_reports
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classroom_reports_preschool_id_fkey') THEN
    ALTER TABLE "public"."classroom_reports" 
    ADD CONSTRAINT "classroom_reports_preschool_id_fkey" 
    FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;
  END IF;
  
  -- Reference users table instead of teacher_profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classroom_reports_teacher_id_fkey') THEN
    ALTER TABLE "public"."classroom_reports" 
    ADD CONSTRAINT "classroom_reports_teacher_id_fkey" 
    FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classroom_reports_student_id_fkey') THEN
    ALTER TABLE "public"."classroom_reports" 
    ADD CONSTRAINT "classroom_reports_student_id_fkey" 
    FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'classroom_reports_class_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
      ALTER TABLE "public"."classroom_reports" 
      ADD CONSTRAINT "classroom_reports_class_id_fkey" 
      FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;
    END IF;
  END IF;
  
  -- Foreign keys for billing_cycles
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'billing_cycles_preschool_id_fkey') THEN
    ALTER TABLE "public"."billing_cycles" 
    ADD CONSTRAINT "billing_cycles_preschool_id_fkey" 
    FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'billing_cycles_subscription_plan_id_fkey') THEN
    ALTER TABLE "public"."billing_cycles" 
    ADD CONSTRAINT "billing_cycles_subscription_plan_id_fkey" 
    FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE SET NULL;
  END IF;
  
  -- Foreign keys for assessment_rubrics
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assessment_rubrics_preschool_id_fkey') THEN
    ALTER TABLE "public"."assessment_rubrics" 
    ADD CONSTRAINT "assessment_rubrics_preschool_id_fkey" 
    FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assessment_rubrics_created_by_fkey') THEN
    ALTER TABLE "public"."assessment_rubrics" 
    ADD CONSTRAINT "assessment_rubrics_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assessment_rubrics_age_group_id_fkey') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'age_groups') THEN
      ALTER TABLE "public"."assessment_rubrics" 
      ADD CONSTRAINT "assessment_rubrics_age_group_id_fkey" 
      FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id") ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_classroom_reports_preschool_student" ON "public"."classroom_reports"("preschool_id", "student_id");
CREATE INDEX IF NOT EXISTS "idx_classroom_reports_teacher_date" ON "public"."classroom_reports"("teacher_id", "report_date");
CREATE INDEX IF NOT EXISTS "idx_classroom_reports_type_date" ON "public"."classroom_reports"("report_type", "report_date");

CREATE INDEX IF NOT EXISTS "idx_billing_cycles_preschool_active" ON "public"."billing_cycles"("preschool_id", "status");
CREATE INDEX IF NOT EXISTS "idx_billing_cycles_next_billing" ON "public"."billing_cycles"("next_billing_date");

-- Enable RLS on all new tables (policies will be added later after functions are created)
ALTER TABLE "public"."classroom_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."billing_cycles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."assessment_rubrics" ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added in a separate migration after required functions are available

-- Triggers will be added in a separate migration after moddatetime function is available
