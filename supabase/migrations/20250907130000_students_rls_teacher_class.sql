-- 2025-09-07: Refine students RLS to enforce teacher class scoping and explicit principal/admin access
-- Idempotent-ish: drops a broad students SELECT policy if present, then creates scoped policies

begin;

-- Enable RLS on students if not already enabled
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;

-- Drop overly broad policy if it exists (name may vary by environment)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students' 
      AND policyname = 'Users can view students in their preschool'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view students in their preschool" ON public.students';
  END IF;
END $$;

-- Parents: can view their own children (retain if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students' 
      AND policyname = 'Parents can view their children'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Parents can view their children" ON public.students
        FOR SELECT USING (
          parent_id = (
            SELECT u.id FROM public.users u
            WHERE u.auth_user_id = auth.uid()
          )
        );
    $$;
  END IF;
END $$;

-- Principals/Admins: can view students in their preschool
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students' 
      AND policyname = 'School admins can view students in their preschool'
  ) THEN
    EXECUTE $$
      CREATE POLICY "School admins can view students in their preschool" ON public.students
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid()
              AND u.preschool_id = students.preschool_id
              AND lower(u.role) IN ('principal','preschool_admin','school_admin','admin')
          )
        );
    $$;
  END IF;
END $$;

-- Teachers: can view students only in their own classes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'students' 
      AND policyname = 'Teachers can view students in their classes'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Teachers can view students in their classes" ON public.students
        FOR SELECT USING (
          EXISTS (
            SELECT 1
            FROM public.users u
            JOIN public.classes c ON c.teacher_id = u.id
            WHERE u.auth_user_id = auth.uid()
              AND c.id = students.class_id
          )
        );
    $$;
  END IF;
END $$;

commit;

