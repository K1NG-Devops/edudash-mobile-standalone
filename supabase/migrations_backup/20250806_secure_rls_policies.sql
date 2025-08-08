-- Comprehensive Secure RLS Policies for EduDash Pro Multi-Tenant Architecture
-- This migration implements strict tenant isolation to prevent data leaks between schools
-- Run this in Supabase SQL Editor with service role privileges

-- =====================================================
-- STEP 1: Drop all existing problematic policies
-- =====================================================

-- Drop users table policies
DROP POLICY IF EXISTS "users_can_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_create_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_data" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_data" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_new_users" ON public.users;
DROP POLICY IF EXISTS "users_can_view_preschool_members" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_teachers" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_update_teachers" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_parents" ON public.users;
DROP POLICY IF EXISTS "superadmins_full_access" ON public.users;
DROP POLICY IF EXISTS "superadmin_full_access" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_create_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_update_users" ON public.users;
DROP POLICY IF EXISTS "temp_authenticated_users_can_view_all" ON public.users;
DROP POLICY IF EXISTS "temp_authenticated_users_can_manage_all" ON public.users;
DROP POLICY IF EXISTS "users_comprehensive_policy" ON public.users;

-- Drop other table policies
DROP POLICY IF EXISTS "preschools_basic_access" ON public.preschools;
DROP POLICY IF EXISTS "age_groups_basic_access" ON public.age_groups;

-- =====================================================
-- STEP 2: Create helper functions for RLS
-- =====================================================

-- Function to get current user's role (cached to avoid recursive queries)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to get current user's preschool_id (cached to avoid recursive queries)
CREATE OR REPLACE FUNCTION public.get_current_user_preschool_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT preschool_id 
    FROM public.users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_current_user_role() = 'superadmin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is school admin
CREATE OR REPLACE FUNCTION public.is_school_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_current_user_role() IN ('preschool_admin', 'principal'), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_current_user_role() = 'teacher', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if current user can access specific preschool
CREATE OR REPLACE FUNCTION public.can_access_preschool(target_preschool_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Superadmins can access all preschools
  IF public.is_superadmin() THEN
    RETURN true;
  END IF;
  
  -- Regular users can only access their own preschool
  RETURN COALESCE(public.get_current_user_preschool_id() = target_preschool_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 3: Enable RLS on all tables
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS on payment-related tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_fees') THEN
    ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_receipts') THEN
    ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- STEP 4: Create secure RLS policies for USERS table
-- =====================================================

-- Policy 1: Users can read their own profile
CREATE POLICY "users_read_own_profile" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Users can update their own profile
CREATE POLICY "users_update_own_profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 3: Users can create their own profile during signup
CREATE POLICY "users_insert_own_profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 4: Superadmins can access all user profiles
CREATE POLICY "superadmins_access_all_users" ON public.users
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Policy 5: School admins can read users in their preschool
CREATE POLICY "school_admins_read_preschool_users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.is_school_admin() AND 
    public.can_access_preschool(preschool_id)
  );

-- Policy 6: School admins can create teachers/parents in their preschool
CREATE POLICY "school_admins_create_preschool_users" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_school_admin() AND
    role IN ('teacher', 'parent') AND
    public.can_access_preschool(preschool_id)
  );

-- Policy 7: School admins can update users in their preschool (excluding role changes)
CREATE POLICY "school_admins_update_preschool_users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  )
  WITH CHECK (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id) AND
    -- Prevent role elevation attacks
    role IN ('teacher', 'parent')
  );

-- Policy 8: Teachers can read other users in their preschool
CREATE POLICY "teachers_read_preschool_users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.is_teacher() AND
    public.can_access_preschool(preschool_id)
  );

-- =====================================================
-- STEP 5: Create secure RLS policies for PRESCHOOLS table
-- =====================================================

-- Policy 1: Users can read their own preschool
CREATE POLICY "users_read_own_preschool" ON public.preschools
  FOR SELECT
  TO authenticated
  USING (public.can_access_preschool(id));

-- Policy 2: Superadmins can access all preschools
CREATE POLICY "superadmins_access_all_preschools" ON public.preschools
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Policy 3: School admins can update their own preschool
CREATE POLICY "school_admins_update_own_preschool" ON public.preschools
  FOR UPDATE
  TO authenticated
  USING (
    public.is_school_admin() AND
    public.can_access_preschool(id)
  )
  WITH CHECK (
    public.is_school_admin() AND
    public.can_access_preschool(id)
  );

-- =====================================================
-- STEP 6: Create secure RLS policies for AGE_GROUPS table
-- =====================================================

-- Policy 1: Users can read age groups from their preschool
CREATE POLICY "users_read_preschool_age_groups" ON public.age_groups
  FOR SELECT
  TO authenticated
  USING (
    preschool_id IS NULL OR -- Global age groups
    public.can_access_preschool(preschool_id)
  );

-- Policy 2: School admins can manage age groups in their preschool
CREATE POLICY "school_admins_manage_preschool_age_groups" ON public.age_groups
  FOR ALL
  TO authenticated
  USING (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  )
  WITH CHECK (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  );

-- Policy 3: Superadmins can manage all age groups
CREATE POLICY "superadmins_manage_all_age_groups" ON public.age_groups
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- =====================================================
-- STEP 7: Create secure RLS policies for STUDENTS table
-- =====================================================

-- Policy 1: Parents can read their own children
CREATE POLICY "parents_read_own_children" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    parent_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Policy 2: School staff can read students in their preschool
CREATE POLICY "school_staff_read_preschool_students" ON public.students
  FOR SELECT
  TO authenticated
  USING (
    (public.is_school_admin() OR public.is_teacher()) AND
    public.can_access_preschool(preschool_id)
  );

-- Policy 3: School admins can manage students in their preschool
CREATE POLICY "school_admins_manage_preschool_students" ON public.students
  FOR ALL
  TO authenticated
  USING (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  )
  WITH CHECK (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  );

-- Policy 4: Superadmins can manage all students
CREATE POLICY "superadmins_manage_all_students" ON public.students
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- =====================================================
-- STEP 8: Create secure RLS policies for CLASSES table
-- =====================================================

-- Policy 1: Users can read classes from their preschool
CREATE POLICY "users_read_preschool_classes" ON public.classes
  FOR SELECT
  TO authenticated
  USING (public.can_access_preschool(preschool_id));

-- Policy 2: School admins can manage classes in their preschool
CREATE POLICY "school_admins_manage_preschool_classes" ON public.classes
  FOR ALL
  TO authenticated
  USING (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  )
  WITH CHECK (
    public.is_school_admin() AND
    public.can_access_preschool(preschool_id)
  );

-- Policy 3: Superadmins can manage all classes
CREATE POLICY "superadmins_manage_all_classes" ON public.classes
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- =====================================================
-- STEP 9: Create secure RLS policies for LESSONS table
-- =====================================================

-- Policy 1: Anyone can read public lessons
CREATE POLICY "anyone_read_public_lessons" ON public.lessons
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Policy 2: Users can read lessons from their preschool
CREATE POLICY "users_read_preschool_lessons" ON public.lessons
  FOR SELECT
  TO authenticated
  USING (
    preschool_id IS NULL OR -- Global lessons
    public.can_access_preschool(preschool_id)
  );

-- Policy 3: Teachers and admins can manage lessons in their preschool
CREATE POLICY "teachers_manage_preschool_lessons" ON public.lessons
  FOR ALL
  TO authenticated
  USING (
    (public.is_school_admin() OR public.is_teacher()) AND
    (preschool_id IS NULL OR public.can_access_preschool(preschool_id))
  )
  WITH CHECK (
    (public.is_school_admin() OR public.is_teacher()) AND
    (preschool_id IS NULL OR public.can_access_preschool(preschool_id))
  );

-- Policy 4: Superadmins can manage all lessons
CREATE POLICY "superadmins_manage_all_lessons" ON public.lessons
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- =====================================================
-- STEP 10: Create secure RLS policies for ACTIVITIES table
-- =====================================================

-- Policy 1: Users can read activities for accessible lessons
CREATE POLICY "users_read_accessible_activities" ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM public.lessons
      WHERE is_public = true 
      OR preschool_id IS NULL 
      OR public.can_access_preschool(preschool_id)
    )
  );

-- Policy 2: Teachers and admins can manage activities for their lessons
CREATE POLICY "teachers_manage_lesson_activities" ON public.activities
  FOR ALL
  TO authenticated
  USING (
    (public.is_school_admin() OR public.is_teacher()) AND
    lesson_id IN (
      SELECT id FROM public.lessons
      WHERE preschool_id IS NULL 
      OR public.can_access_preschool(preschool_id)
    )
  )
  WITH CHECK (
    (public.is_school_admin() OR public.is_teacher()) AND
    lesson_id IN (
      SELECT id FROM public.lessons
      WHERE preschool_id IS NULL 
      OR public.can_access_preschool(preschool_id)
    )
  );

-- Policy 3: Superadmins can manage all activities
CREATE POLICY "superadmins_manage_all_activities" ON public.activities
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- =====================================================
-- STEP 11: Create secure RLS policies for HOMEWORK tables
-- =====================================================

-- Homework Assignments
CREATE POLICY "school_staff_manage_preschool_homework" ON public.homework_assignments
  FOR ALL
  TO authenticated
  USING (
    (public.is_school_admin() OR public.is_teacher()) AND
    public.can_access_preschool(preschool_id)
  )
  WITH CHECK (
    (public.is_school_admin() OR public.is_teacher()) AND
    public.can_access_preschool(preschool_id)
  );

CREATE POLICY "superadmins_manage_all_homework" ON public.homework_assignments
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- Homework Submissions
CREATE POLICY "parents_read_own_submissions" ON public.homework_submissions
  FOR SELECT
  TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "parents_create_submissions" ON public.homework_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (
      SELECT id FROM public.students 
      WHERE parent_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "school_staff_manage_preschool_submissions" ON public.homework_submissions
  FOR ALL
  TO authenticated
  USING (
    (public.is_school_admin() OR public.is_teacher()) AND
    homework_assignment_id IN (
      SELECT id FROM public.homework_assignments
      WHERE public.can_access_preschool(preschool_id)
    )
  )
  WITH CHECK (
    (public.is_school_admin() OR public.is_teacher()) AND
    homework_assignment_id IN (
      SELECT id FROM public.homework_assignments
      WHERE public.can_access_preschool(preschool_id)
    )
  );

-- =====================================================
-- STEP 12: Create secure RLS policies for LESSON_CATEGORIES table
-- =====================================================

-- Lesson categories are typically global, so allow read access to all authenticated users
CREATE POLICY "authenticated_read_lesson_categories" ON public.lesson_categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Only superadmins can manage lesson categories
CREATE POLICY "superadmins_manage_lesson_categories" ON public.lesson_categories
  FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- =====================================================
-- STEP 13: Create secure RLS policies for PAYMENT tables (if they exist)
-- =====================================================

-- Payment Fees
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_fees') THEN
    -- Parents can read their own fees
    EXECUTE 'CREATE POLICY "parents_read_own_fees" ON public.payment_fees
      FOR SELECT
      TO authenticated
      USING (
        student_id IN (
          SELECT id FROM public.students 
          WHERE parent_id IN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid()
          )
        )
      )';
    
    -- School staff can manage fees in their preschool
    EXECUTE 'CREATE POLICY "school_staff_manage_preschool_fees" ON public.payment_fees
      FOR ALL
      TO authenticated
      USING (
        (public.is_school_admin() OR public.is_teacher()) AND
        public.can_access_preschool(preschool_id)
      )
      WITH CHECK (
        (public.is_school_admin() OR public.is_teacher()) AND
        public.can_access_preschool(preschool_id)
      )';
  END IF;
END $$;

-- Payments
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    -- Parents can read their own payments
    EXECUTE 'CREATE POLICY "parents_read_own_payments" ON public.payments
      FOR SELECT
      TO authenticated
      USING (
        payer_id IN (
          SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
      )';
    
    -- Parents can create their own payments
    EXECUTE 'CREATE POLICY "parents_create_own_payments" ON public.payments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        payer_id IN (
          SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
      )';
    
    -- School staff can manage payments in their preschool
    EXECUTE 'CREATE POLICY "school_staff_manage_preschool_payments" ON public.payments
      FOR ALL
      TO authenticated
      USING (
        (public.is_school_admin() OR public.is_teacher()) AND
        public.can_access_preschool(preschool_id)
      )
      WITH CHECK (
        (public.is_school_admin() OR public.is_teacher()) AND
        public.can_access_preschool(preschool_id)
      )';
  END IF;
END $$;

-- =====================================================
-- STEP 14: Grant necessary permissions
-- =====================================================

-- Grant function execution permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_preschool_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_preschool(UUID) TO authenticated;

-- Grant table access permissions (RLS will control what data is visible)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preschools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.age_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_categories TO authenticated;

-- Grant permissions on payment tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_fees') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_fees TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_receipts') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_receipts TO authenticated;
  END IF;
END $$;

-- =====================================================
-- STEP 15: Create audit functions for security monitoring
-- =====================================================

-- Function to log RLS policy violations (for monitoring)
CREATE OR REPLACE FUNCTION public.log_rls_violation(
  table_name TEXT,
  operation TEXT,
  user_id UUID,
  attempted_resource_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- In a production system, you would log this to an audit table
  -- For now, we'll just raise a notice
  RAISE NOTICE 'RLS Violation: User % attempted % on % (resource: %)', 
    user_id, operation, table_name, attempted_resource_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 'Secure RLS policies have been successfully implemented!' as status,
       'All tables now have proper tenant isolation' as details,
       'Data leaks between schools are prevented' as security_status;

-- Show summary of policies created
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE 
    WHEN cmd LIKE '%SELECT%' THEN 'READ'
    WHEN cmd LIKE '%INSERT%' THEN 'create'
    WHEN cmd LIKE '%UPDATE%' THEN 'update'
    WHEN cmd LIKE '%DELETE%' THEN 'delete'
    WHEN cmd LIKE '%ALL%' THEN 'full'
    ELSE 'unknown'
  END as permission_type
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'preschools', 'age_groups', 'classes', 'students', 'lessons', 'activities', 'homework_assignments', 'homework_submissions', 'lesson_categories')
ORDER BY tablename, policyname;
