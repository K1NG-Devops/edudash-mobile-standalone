-- COMPLETE POLICY REMOVAL: Remove ALL policies from users table to start fresh
-- This will help us identify which specific policy is causing the infinite recursion

-- Get all policy names first (for documentation)
-- Query: SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users';

-- Drop every possible policy that might exist on the users table
DROP POLICY IF EXISTS "users_can_view_own_data" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_data" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_new_users" ON public.users;
DROP POLICY IF EXISTS "users_can_create_own_profile" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_create_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_update_users" ON public.users;
DROP POLICY IF EXISTS "users_can_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_profile" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_manage_preschool_users" ON public.users;
DROP POLICY IF EXISTS "teachers_can_view_preschool_users" ON public.users;
DROP POLICY IF EXISTS "temp_authenticated_users_can_view_all" ON public.users;
DROP POLICY IF EXISTS "temp_authenticated_users_can_manage_all" ON public.users;
DROP POLICY IF EXISTS "users_can_view_same_preschool" ON public.users;
DROP POLICY IF EXISTS "users_can_create_same_preschool" ON public.users;
DROP POLICY IF EXISTS "users_can_update_same_preschool" ON public.users;
DROP POLICY IF EXISTS "superadmin_full_access" ON public.users;
DROP POLICY IF EXISTS "preschool_users_access" ON public.users;
DROP POLICY IF EXISTS "users_own_profile_access" ON public.users;
DROP POLICY IF EXISTS "preschool_admin_access" ON public.users;
DROP POLICY IF EXISTS "teacher_access" ON public.users;
DROP POLICY IF EXISTS "parent_access" ON public.users;

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS (but with NO policies)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant basic permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Add a comment to track what we've done
COMMENT ON TABLE public.users IS 'All RLS policies removed. Ready for step-by-step policy addition.';

SELECT 'All policies removed from users table. RLS is enabled but no policies exist.' as status;
