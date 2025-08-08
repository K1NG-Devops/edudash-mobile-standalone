-- Comprehensive schema reset and recreation
-- This migration drops all existing tables and recreates them with proper structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all existing tables to start fresh (in dependency order)
DROP TABLE IF EXISTS public.homework_submissions CASCADE;
DROP TABLE IF EXISTS public.homework_assignments CASCADE;
DROP TABLE IF EXISTS public.payment_notifications CASCADE;
DROP TABLE IF EXISTS public.payment_receipts CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.payment_fees CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.emergency_alert_acknowledgments CASCADE;
DROP TABLE IF EXISTS public.emergency_alerts CASCADE;
DROP TABLE IF EXISTS public.media_uploads CASCADE;
DROP TABLE IF EXISTS public.message_notifications CASCADE;
DROP TABLE IF EXISTS public.message_recipients CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.video_call_sessions CASCADE;
DROP TABLE IF EXISTS public.classroom_reports CASCADE;
DROP TABLE IF EXISTS public.student_medical_info CASCADE;
DROP TABLE IF EXISTS public.emergency_contacts CASCADE;
DROP TABLE IF EXISTS public.parent_details CASCADE;
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.user_preferences CASCADE;
DROP TABLE IF EXISTS public.tenant_settings CASCADE;
DROP TABLE IF EXISTS public.tenant_onboarding_steps CASCADE;
DROP TABLE IF EXISTS public.tenant_invitations CASCADE;
DROP TABLE IF EXISTS public.student_registrations CASCADE;
DROP TABLE IF EXISTS public.teacher_class_schedules CASCADE;
DROP TABLE IF EXISTS public.class_assignments CASCADE;
DROP TABLE IF EXISTS public.invitation_uses CASCADE;
DROP TABLE IF EXISTS public.school_invitation_codes CASCADE;
DROP TABLE IF EXISTS public.parent_access_codes CASCADE;
DROP TABLE IF EXISTS public.premium_features CASCADE;
DROP TABLE IF EXISTS public.preschool_onboarding_requests CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.lesson_categories CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.age_groups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.preschools CASCADE;
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.admin_roles CASCADE;

-- Create core tables

-- Table: Preschools (must be first for foreign keys)
CREATE TABLE public.preschools (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name varchar(255) NOT NULL,
  address text,
  phone varchar(20),
  email varchar(255) UNIQUE NOT NULL,
  logo_url text,
  subscription_plan varchar(20) DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'premium')),
  subscription_status varchar(20) DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'inactive', 'cancelled')),
  subscription_start_date date,
  subscription_end_date date,
  billing_email varchar(255),
  max_students integer DEFAULT 50,
  max_teachers integer DEFAULT 10,
  onboarding_status varchar(20) DEFAULT 'requested' CHECK (onboarding_status IN ('requested', 'approved', 'setup', 'completed')),
  setup_completed boolean DEFAULT false,
  tenant_slug varchar(50) UNIQUE,
  domain varchar(100),
  timezone varchar(50) DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Users
CREATE TABLE public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255),
  name varchar(255) NOT NULL,
  role varchar(20) NOT NULL CHECK (role IN ('superadmin', 'admin', 'principal', 'teacher', 'parent')),
  preschool_id uuid REFERENCES public.preschools(id) ON DELETE CASCADE,
  avatar_url text,
  phone varchar(20),
  address text,
  home_address text,
  is_active boolean DEFAULT true,
  auth_user_id uuid REFERENCES auth.users(id),
  profile_completion_status varchar(50) DEFAULT 'incomplete',
  profile_completed_at timestamptz,
  subscription_tier varchar(20) DEFAULT 'free',
  subscription_features jsonb DEFAULT '{}',
  subscription_expires_at timestamptz,
  work_company varchar(255),
  work_position varchar(255),
  work_address text,
  work_phone varchar(50),
  relationship_to_child varchar(100) DEFAULT 'parent',
  pickup_authorized text,
  emergency_contact_1_name varchar(255),
  emergency_contact_1_phone varchar(50),
  emergency_contact_1_relationship varchar(100),
  emergency_contact_2_name varchar(255),
  emergency_contact_2_phone varchar(50),
  emergency_contact_2_relationship varchar(100),
  home_city varchar(100),
  home_postal_code varchar(20),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Age Groups
CREATE TABLE public.age_groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name varchar(50) NOT NULL,
  min_age integer DEFAULT 0,
  max_age integer DEFAULT 5,
  min_age_months integer,
  max_age_months integer,
  description text,
  preschool_id uuid REFERENCES public.preschools(id),
  created_at timestamptz DEFAULT now()
);

-- Table: Classes
CREATE TABLE public.classes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  age_group_id uuid NOT NULL REFERENCES public.age_groups(id),
  teacher_id uuid REFERENCES public.users(id),
  max_capacity integer DEFAULT 15,
  current_enrollment integer DEFAULT 0,
  room_number varchar(50),
  icon_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table: Students
CREATE TABLE public.students (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id),
  first_name varchar(255) NOT NULL,
  last_name varchar(255) NOT NULL,
  nickname varchar(100),
  date_of_birth date NOT NULL,
  sex varchar(20),
  gender varchar(20),
  age_group_id uuid NOT NULL REFERENCES public.age_groups(id),
  parent_id uuid REFERENCES public.users(id),
  emergency_contact_name varchar(255),
  emergency_contact_phone varchar(20),
  emergency_contact_relation varchar(100),
  allergies text,
  special_needs text,
  medical_conditions text,
  medications text,
  dietary_restrictions text,
  home_language varchar(100),
  home_address text,
  previous_preschool varchar(255),
  previous_experience text,
  previous_school_experience text,
  enrollment_date date DEFAULT CURRENT_DATE,
  attendance_days text[],
  time_block varchar(100),
  registration_fee varchar(50),
  payment_method varchar(50),
  consent_policies boolean DEFAULT true,
  consent_media boolean DEFAULT true,
  consent_field_trips boolean DEFAULT true,
  consent_photography boolean DEFAULT true,
  document_uploads jsonb DEFAULT '[]',
  additional_notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Lesson Categories
CREATE TABLE public.lesson_categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name varchar(100) NOT NULL,
  description text,
  icon varchar(50),
  icon_name varchar(50),
  color varchar(7),
  color_theme varchar(7)
);

-- Table: Lessons
CREATE TABLE public.lessons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  content text,
  category_id uuid NOT NULL REFERENCES public.lesson_categories(id),
  age_group_id uuid NOT NULL REFERENCES public.age_groups(id),
  duration_minutes integer DEFAULT 30,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  materials_needed text,
  learning_objectives text,
  is_public boolean DEFAULT false,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tier varchar(20) DEFAULT 'free',
  has_video boolean DEFAULT false,
  has_interactive boolean DEFAULT false,
  has_printables boolean DEFAULT false,
  stem_concepts text[],
  home_extension text[],
  preschool_id uuid REFERENCES public.preschools(id),
  created_by uuid REFERENCES public.users(id),
  thumbnail_url text,
  video_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Activities
CREATE TABLE public.activities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  activity_type varchar(50) NOT NULL,
  instructions text,
  estimated_time integer,
  materials text,
  sequence_order integer DEFAULT 1
);

-- Table: Homework Assignments
CREATE TABLE public.homework_assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  instructions text,
  materials_needed text,
  estimated_time_minutes integer DEFAULT 30,
  due_date_offset_days integer NOT NULL DEFAULT 7,
  difficulty_level integer DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  is_required boolean DEFAULT true,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Homework Submissions
CREATE TABLE public.homework_submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  homework_assignment_id uuid NOT NULL REFERENCES public.homework_assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submission_text text,
  attachment_urls text[] DEFAULT '{}',
  submitted_at timestamptz DEFAULT now(),
  status text CHECK (status IN ('pending', 'submitted', 'reviewed', 'completed')) DEFAULT 'submitted',
  teacher_feedback text,
  grade text,
  graded_at timestamptz,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_preschool_id ON public.users(preschool_id);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_role_preschool ON public.users(role, preschool_id);
CREATE INDEX idx_students_preschool_id ON public.students(preschool_id);
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_students_parent_id ON public.students(parent_id);
CREATE INDEX idx_classes_preschool_id ON public.classes(preschool_id);
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_lessons_category_age ON public.lessons(category_id, age_group_id);
CREATE INDEX idx_lessons_public ON public.lessons(is_public) WHERE is_public = true;
CREATE INDEX idx_homework_assignments_teacher ON public.homework_assignments(teacher_id);
CREATE INDEX idx_homework_assignments_class ON public.homework_assignments(class_id);
CREATE INDEX idx_homework_assignments_preschool ON public.homework_assignments(preschool_id);
CREATE INDEX idx_homework_assignments_active ON public.homework_assignments(is_active) WHERE is_active = true;
CREATE INDEX idx_homework_submissions_assignment ON public.homework_submissions(homework_assignment_id);
CREATE INDEX idx_homework_submissions_student ON public.homework_submissions(student_id);
CREATE INDEX idx_homework_submissions_parent ON public.homework_submissions(parent_id);
CREATE INDEX idx_homework_submissions_status ON public.homework_submissions(status);
CREATE INDEX idx_homework_submissions_submitted_at ON public.homework_submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Preschools: Super-admins can see all, others only their own
CREATE POLICY "preschools_policy" ON public.preschools
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  );

-- Users: Users can see users from their preschool (bypass RLS for superadmin)
CREATE POLICY "users_policy" ON public.users
  USING (
    auth.uid() = auth_user_id OR
    role = 'superadmin' OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND (u.role = 'superadmin' OR u.preschool_id = users.preschool_id)
    )
  )
  WITH CHECK (
    auth.uid() = auth_user_id OR
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND (u.role = 'superadmin' OR u.preschool_id = users.preschool_id)
    )
  );

-- Age Groups: Viewable by authenticated users in same preschool or public ones
CREATE POLICY "age_groups_policy" ON public.age_groups
  USING (
    preschool_id IS NULL OR
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Classes: Users can see classes from their preschool
CREATE POLICY "classes_policy" ON public.classes
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Students: Users can see students from their preschool
CREATE POLICY "students_policy" ON public.students
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (
      -- Teachers and admins can see all students in their preschool
      (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'principal', 'teacher')
      OR
      -- Parents can only see their own children
      (
        (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'parent'
        AND parent_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
    )
  );

-- Lesson Categories: Public access for authenticated users
CREATE POLICY "lesson_categories_policy" ON public.lesson_categories
  USING (auth.role() = 'authenticated');

-- Lessons: Public lessons for all, private lessons for preschool members
CREATE POLICY "lessons_policy" ON public.lessons
  USING (
    is_public = true OR
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Activities: Access based on lesson access
CREATE POLICY "activities_policy" ON public.activities
  USING (
    EXISTS (
      SELECT 1 FROM public.lessons l 
      WHERE l.id = lesson_id 
      AND (
        l.is_public = true OR
        l.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
      )
    )
  );

-- Homework Assignments: Users can see assignments from their preschool
CREATE POLICY "homework_assignments_policy" ON public.homework_assignments
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Homework Submissions: Role-based access
CREATE POLICY "homework_submissions_policy" ON public.homework_submissions
  USING (
    EXISTS (
      SELECT 1 FROM public.homework_assignments ha 
      WHERE ha.id = homework_assignment_id 
      AND ha.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    )
    AND (
      -- Teachers and admins can see all submissions in their preschool
      (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'principal', 'teacher')
      OR
      -- Parents can only see submissions for their children
      (
        (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'parent'
        AND student_id IN (
          SELECT s.id FROM public.students s 
          WHERE s.parent_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.homework_assignments ha 
      WHERE ha.id = homework_assignment_id 
      AND ha.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.preschools TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.age_groups TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.lesson_categories TO authenticated;
GRANT ALL ON public.lessons TO authenticated;
GRANT ALL ON public.activities TO authenticated;
GRANT ALL ON public.homework_assignments TO authenticated;
GRANT ALL ON public.homework_submissions TO authenticated;

-- Insert basic reference data
INSERT INTO public.lesson_categories (name, description, icon, color) VALUES
('Mathematics', 'Numbers, counting, basic math concepts', 'calculator', '#3B82F6'),
('Language Arts', 'Reading, writing, vocabulary', 'book', '#10B981'),
('Science', 'Nature, experiments, discovery', 'flask', '#F59E0B'),
('Arts & Crafts', 'Creative expression, fine motor skills', 'palette', '#EF4444'),
('Physical Education', 'Movement, coordination, exercise', 'figure-walk', '#8B5CF6'),
('Social Studies', 'Community, culture, relationships', 'people', '#06B6D4')
ON CONFLICT DO NOTHING;

INSERT INTO public.age_groups (name, min_age, max_age, description) VALUES
('Toddlers', 1, 2, 'Ages 1-2 years'),
('Pre-K 3', 3, 3, 'Ages 3 years'),
('Pre-K 4', 4, 4, 'Ages 4 years'),
('Kindergarten', 5, 5, 'Ages 5 years'),
('Mixed Ages', 1, 5, 'Mixed age groups 1-5 years')
ON CONFLICT DO NOTHING;

-- Create EduDash Pro Platform SuperAdmin
-- This superadmin manages the entire SaaS platform
INSERT INTO public.users (
  email,
  name,
  role,
  is_active,
  profile_completion_status,
  profile_completed_at,
  subscription_tier,
  created_at,
  updated_at
) VALUES (
  'admin@edudashpro.com',
  'EduDash Pro Super Admin',
  'superadmin',
  true,
  'complete',
  now(),
  'enterprise',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a demo preschool for testing
INSERT INTO public.preschools (
  name,
  email,
  address,
  phone,
  subscription_plan,
  subscription_status,
  onboarding_status,
  setup_completed,
  tenant_slug,
  max_students,
  max_teachers,
  created_at,
  updated_at
) VALUES (
  'Sunshine Kids Preschool',
  'admin@sunshinekids.demo',
  '123 Learning Lane, Education City, EC 12345',
  '+1-555-0123',
  'trial',
  'active',
  'completed',
  true,
  'sunshine-kids-demo',
  100,
  20,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a demo principal for the demo preschool
INSERT INTO public.users (
  email,
  name,
  role,
  preschool_id,
  is_active,
  profile_completion_status,
  profile_completed_at,
  phone,
  address,
  created_at,
  updated_at
) VALUES (
  'principal@sunshinekids.demo',
  'Sarah Johnson',
  'principal',
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo'),
  true,
  'complete',
  now(),
  '+1-555-0124',
  '123 Learning Lane, Education City, EC 12345',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a demo teacher
INSERT INTO public.users (
  email,
  name,
  role,
  preschool_id,
  is_active,
  profile_completion_status,
  profile_completed_at,
  phone,
  created_at,
  updated_at
) VALUES (
  'teacher@sunshinekids.demo',
  'Emily Davis',
  'teacher',
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo'),
  true,
  'complete',
  now(),
  '+1-555-0125',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a demo parent
INSERT INTO public.users (
  email,
  name,
  role,
  preschool_id,
  is_active,
  profile_completion_status,
  profile_completed_at,
  phone,
  relationship_to_child,
  created_at,
  updated_at
) VALUES (
  'parent@sunshinekids.demo',
  'Michael Smith',
  'parent',
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo'),
  true,
  'complete',
  now(),
  '+1-555-0126',
  'father',
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Create a demo class
INSERT INTO public.classes (
  preschool_id,
  name,
  age_group_id,
  teacher_id,
  max_capacity,
  current_enrollment,
  room_number,
  is_active,
  created_at
) VALUES (
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo'),
  'Rainbow Room',
  (SELECT id FROM public.age_groups WHERE name = 'Pre-K 4' LIMIT 1),
  (SELECT id FROM public.users WHERE email = 'teacher@sunshinekids.demo'),
  20,
  1,
  'Room 101',
  true,
  now()
) ON CONFLICT DO NOTHING;

-- Create a demo student
INSERT INTO public.students (
  preschool_id,
  class_id,
  first_name,
  last_name,
  date_of_birth,
  age_group_id,
  parent_id,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relation,
  enrollment_date,
  is_active,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo'),
  (SELECT id FROM public.classes WHERE name = 'Rainbow Room'),
  'Emma',
  'Smith',
  '2020-03-15',
  (SELECT id FROM public.age_groups WHERE name = 'Pre-K 4' LIMIT 1),
  (SELECT id FROM public.users WHERE email = 'parent@sunshinekids.demo'),
  'Michael Smith',
  '+1-555-0126',
  'Father',
  CURRENT_DATE - INTERVAL '30 days',
  true,
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- Update class enrollment count
UPDATE public.classes 
SET current_enrollment = (
  SELECT COUNT(*) FROM public.students 
  WHERE class_id = public.classes.id AND is_active = true
)
WHERE name = 'Rainbow Room';

-- Insert sample homework assignments for testing
INSERT INTO public.homework_assignments (
  title, 
  description, 
  instructions, 
  materials_needed, 
  estimated_time_minutes, 
  due_date_offset_days, 
  difficulty_level, 
  teacher_id, 
  preschool_id
) VALUES 
(
  'Math Practice - Addition',
  'Practice addition problems with numbers 1-10',
  'Complete the worksheet and show your work. Take a photo of each page.',
  'Pencil, worksheet, crayons for coloring',
  30,
  3,
  2,
  (SELECT id FROM public.users WHERE email = 'teacher@sunshinekids.demo'),
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo')
),
(
  'Reading Comprehension',
  'Read the story and answer questions',
  'Read the story carefully and answer all questions. Record yourself reading if possible.',
  'Story book, worksheet, recording device (optional)',
  45,
  5,
  3,
  (SELECT id FROM public.users WHERE email = 'teacher@sunshinekids.demo'),
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo')
),
(
  'Art Project - Drawing',
  'Draw your favorite animal',
  'Use colors and be creative. Include the animal''s habitat in your drawing.',
  'Paper, crayons, markers, colored pencils',
  60,
  7,
  1,
  (SELECT id FROM public.users WHERE email = 'teacher@sunshinekids.demo'),
  (SELECT id FROM public.preschools WHERE email = 'admin@sunshinekids.demo')
)
ON CONFLICT DO NOTHING;
