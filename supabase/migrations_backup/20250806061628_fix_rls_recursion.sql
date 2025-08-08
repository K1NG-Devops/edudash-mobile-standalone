-- Fix infinite recursion in RLS policies on remote database
-- This will create very simple policies that don't cause recursion

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "users_can_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_view_preschool_members" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_teachers" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_update_teachers" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "superadmins_full_access" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_parents" ON public.users;
DROP POLICY IF EXISTS "users_can_create_own_profile" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_insert_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_update_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_view_preschool_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_create_preschool_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_update_preschool_users" ON public.users;

-- Temporarily disable RLS to avoid recursion issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with very simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own profile (essential for authentication)
CREATE POLICY "users_can_read_own_profile" ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 3: Allow authenticated users to create their own initial profile during signup
CREATE POLICY "users_can_create_own_profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 4: Allow all authenticated users to view all users (temporary - we'll fix this later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'authenticated_users_can_view_all_users'
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated_users_can_view_all_users" ON public.users
               FOR SELECT
               TO authenticated
               USING (true)';
  END IF;
END $$;

-- Policy 5: Allow all authenticated users to create users (temporary - we'll fix this later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'authenticated_users_can_create_users'
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated_users_can_create_users" ON public.users
               FOR INSERT
               TO authenticated
               WITH CHECK (true)';
  END IF;
END $$;

-- Policy 6: Allow all authenticated users to update users (temporary - we'll fix this later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'authenticated_users_can_update_users'
  ) THEN
    EXECUTE 'CREATE POLICY "authenticated_users_can_update_users" ON public.users
               FOR UPDATE
               TO authenticated
               USING (true)
               WITH CHECK (true)';
  END IF;
END $$;
