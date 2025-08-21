-- Complete RLS Setup for EduDash Pro Multi-Tenant System
-- This ensures proper tenant isolation for all tables

-- =====================================================
-- STEP 1: Create helper functions (if they don't exist)
-- =====================================================

-- Function to get current user's role
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

-- Function to get current user's preschool_id
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

-- Function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(public.get_current_user_role() = 'superadmin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Function to check if user can access preschool
CREATE OR REPLACE FUNCTION public.can_access_preschool(target_preschool_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_superadmin() THEN
    RETURN true;
  END IF;
  RETURN COALESCE(public.get_current_user_preschool_id() = target_preschool_id, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- STEP 2: Enable RLS on all critical tables
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Drop existing problematic policies
-- =====================================================

-- Users table
DROP POLICY IF EXISTS "users_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "superadmins_access_all_users" ON public.users;

-- Other tables - drop any existing policies
DROP POLICY IF EXISTS "preschools_policy" ON public.preschools;
DROP POLICY IF EXISTS "students_policy" ON public.students;
DROP POLICY IF EXISTS "classes_policy" ON public.classes;

-- =====================================================
-- STEP 4: Create comprehensive RLS policies
-- =====================================================

-- USERS TABLE POLICIES
CREATE POLICY "users_own_profile" ON public.users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "users_preschool_access" ON public.users
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

CREATE POLICY "superadmin_all_users" ON public.users
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- PRESCHOOLS TABLE POLICIES
CREATE POLICY "preschools_own_access" ON public.preschools
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(id));

CREATE POLICY "superadmin_all_preschools" ON public.preschools
  FOR ALL TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- STUDENTS TABLE POLICIES
CREATE POLICY "students_preschool_access" ON public.students
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

CREATE POLICY "parents_own_students" ON public.students
  FOR SELECT TO authenticated
  USING (
    parent_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "staff_manage_students" ON public.students
  FOR ALL TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'principal', 'teacher') 
    AND public.can_access_preschool(preschool_id)
  );

-- CLASSES TABLE POLICIES
CREATE POLICY "classes_preschool_access" ON public.classes
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

CREATE POLICY "staff_manage_classes" ON public.classes
  FOR ALL TO authenticated
  USING (
    public.get_current_user_role() IN ('admin', 'principal', 'teacher')
    AND public.can_access_preschool(preschool_id)
  );

-- PAYMENT TABLES POLICIES (already have payments, add others)
CREATE POLICY "payment_fees_preschool" ON public.payment_fees
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

CREATE POLICY "payment_methods_own" ON public.payment_methods
  FOR ALL TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- MESSAGES POLICIES
CREATE POLICY "messages_preschool" ON public.messages
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

CREATE POLICY "message_recipients_own" ON public.message_recipients
  FOR SELECT TO authenticated
  USING (
    recipient_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- ADDRESSES POLICIES
CREATE POLICY "addresses_own" ON public.addresses
  FOR ALL TO authenticated
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- EMERGENCY CONTACTS POLICIES
CREATE POLICY "emergency_contacts_preschool" ON public.emergency_contacts
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE public.can_access_preschool(preschool_id)
    )
  );

-- LESSONS POLICIES (can be public or preschool-specific)
CREATE POLICY "lessons_public" ON public.lessons
  FOR SELECT TO authenticated
  USING (is_public = true OR preschool_id IS NULL);

CREATE POLICY "lessons_preschool" ON public.lessons
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

-- ACTIVITIES POLICIES
CREATE POLICY "activities_accessible" ON public.activities
  FOR SELECT TO authenticated
  USING (
    lesson_id IN (
      SELECT id FROM public.lessons 
      WHERE is_public = true 
      OR preschool_id IS NULL 
      OR public.can_access_preschool(preschool_id)
    )
  );

-- HOMEWORK POLICIES
CREATE POLICY "homework_preschool" ON public.homework_assignments
  FOR SELECT TO authenticated
  USING (public.can_access_preschool(preschool_id));

CREATE POLICY "homework_submissions_own" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (
    student_id IN (
      SELECT s.id FROM public.students s
      WHERE s.parent_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
    OR 
    public.can_access_preschool(
      (SELECT s.preschool_id FROM public.students s WHERE s.id = student_id)
    )
  );

-- =====================================================
-- STEP 5: Grant permissions
-- =====================================================

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_preschool_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_preschool(UUID) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preschools TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_fees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

SELECT 'Comprehensive RLS policies have been applied successfully!' as status;
