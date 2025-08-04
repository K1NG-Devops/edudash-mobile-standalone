-- Initial database schema setup

-- Table: Users
CREATE TABLE public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  email text NOT NULL,
  name text,
  role text CHECK (role IN ('superadmin', 'admin', 'principal', 'teacher', 'parent')) NOT NULL,
  phone text,
  address text,
  home_address text,
  is_active boolean DEFAULT true,
  auth_user_id uuid,
  preschool_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  full_name text,
  avatar_url text
);

-- Table: Students
CREATE TABLE public.students (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date NOT NULL,
  age int,
  gender text,
  parent_id uuid,
  preschool_id uuid NOT NULL,
  class_id uuid,
  age_group_id uuid,
  enrollment_date timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  medical_info text,
  emergency_contact text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  allergies text,
  special_needs text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  sex text,
  home_language text,
  home_address text,
  nickname text,
  dietary_restrictions text,
  medications text,
  medical_conditions text,
  previous_preschool text,
  previous_experience text,
  attendance_days text[],
  time_block text,
  consent_policies boolean DEFAULT true,
  consent_media boolean DEFAULT true,
  consent_field_trips boolean DEFAULT true,
  consent_photography boolean DEFAULT true,
  registration_fee text,
  payment_method text,
  document_uploads jsonb,
  additional_notes text
);

-- Table: Classes
CREATE TABLE public.classes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  age_group_id uuid,
  teacher_id uuid,
  max_capacity int NOT NULL,
  current_enrollment int DEFAULT 0,
  room_number text,
  icon_url text,
  preschool_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Preschools
CREATE TABLE public.preschools (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  description text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: HomeworkAssignments
CREATE TABLE public.homework_assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  due_date_offset_days int NOT NULL,
  lesson_id uuid,
  class_id uuid,
  teacher_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Homework Submissions (essential for the homework system)
CREATE TABLE public.homework_submissions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  homework_assignment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  parent_id uuid,
  submission_text text,
  attachment_urls text[],
  submitted_at timestamptz,
  status text CHECK (status IN ('pending', 'submitted', 'reviewed', 'completed')) DEFAULT 'pending',
  teacher_feedback text,
  grade text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Age Groups
CREATE TABLE public.age_groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  min_age int NOT NULL,
  max_age int NOT NULL,
  description text,
  preschool_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Activities
CREATE TABLE public.activities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  description text,
  activity_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  preschool_id uuid NOT NULL,
  class_id uuid,
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Add foreign key constraints
ALTER TABLE public.users ADD CONSTRAINT fk_users_preschool FOREIGN KEY (preschool_id) REFERENCES public.preschools(id);
ALTER TABLE public.students ADD CONSTRAINT fk_students_parent FOREIGN KEY (parent_id) REFERENCES public.users(id);
ALTER TABLE public.students ADD CONSTRAINT fk_students_preschool FOREIGN KEY (preschool_id) REFERENCES public.preschools(id);
ALTER TABLE public.students ADD CONSTRAINT fk_students_class FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.students ADD CONSTRAINT fk_students_age_group FOREIGN KEY (age_group_id) REFERENCES public.age_groups(id);
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_preschool FOREIGN KEY (preschool_id) REFERENCES public.preschools(id);
ALTER TABLE public.classes ADD CONSTRAINT fk_classes_age_group FOREIGN KEY (age_group_id) REFERENCES public.age_groups(id);
ALTER TABLE public.homework_assignments ADD CONSTRAINT fk_homework_teacher FOREIGN KEY (teacher_id) REFERENCES public.users(id);
ALTER TABLE public.homework_assignments ADD CONSTRAINT fk_homework_class FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.homework_submissions ADD CONSTRAINT fk_submissions_homework FOREIGN KEY (homework_assignment_id) REFERENCES public.homework_assignments(id);
ALTER TABLE public.homework_submissions ADD CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES public.students(id);
ALTER TABLE public.homework_submissions ADD CONSTRAINT fk_submissions_parent FOREIGN KEY (parent_id) REFERENCES public.users(id);
ALTER TABLE public.age_groups ADD CONSTRAINT fk_age_groups_preschool FOREIGN KEY (preschool_id) REFERENCES public.preschools(id);
ALTER TABLE public.activities ADD CONSTRAINT fk_activities_preschool FOREIGN KEY (preschool_id) REFERENCES public.preschools(id);
ALTER TABLE public.activities ADD CONSTRAINT fk_activities_class FOREIGN KEY (class_id) REFERENCES public.classes(id);
ALTER TABLE public.activities ADD CONSTRAINT fk_activities_creator FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for multi-tenant isolation

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

-- Users: Super-admins see all, others see users from their preschool
CREATE POLICY "users_policy" ON public.users
  USING (
    CASE 
      WHEN role = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  );

-- Students: Scoped to preschool
CREATE POLICY "students_policy" ON public.students
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  );

-- Classes: Scoped to preschool
CREATE POLICY "classes_policy" ON public.classes
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  );

-- Homework Assignments: Scoped to preschool (via class)
CREATE POLICY "homework_assignments_policy" ON public.homework_assignments
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_id 
        AND c.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
      )
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.classes c 
        WHERE c.id = class_id 
        AND c.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
      )
    END
  );

-- Homework Submissions: Scoped to preschool (via student)
CREATE POLICY "homework_submissions_policy" ON public.homework_submissions
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.students s 
        WHERE s.id = student_id 
        AND s.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
      )
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE EXISTS (
        SELECT 1 FROM public.students s 
        WHERE s.id = student_id 
        AND s.preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
      )
    END
  );

-- Age Groups: Scoped to preschool
CREATE POLICY "age_groups_policy" ON public.age_groups
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  );

-- Activities: Scoped to preschool
CREATE POLICY "activities_policy" ON public.activities
  USING (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  )
  WITH CHECK (
    CASE 
      WHEN (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'superadmin' THEN true
      ELSE preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    END
  );
