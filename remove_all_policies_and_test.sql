-- Remove ALL policies from users table
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

-- Step 1: Add ONE simple policy at a time
CREATE POLICY "simple_own_data_access" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());
