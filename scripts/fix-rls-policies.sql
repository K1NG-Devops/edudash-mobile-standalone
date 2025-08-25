-- Fix RLS Policies for EduDash Pro
-- This script addresses authentication and authorization issues

-- 1. USERS TABLE RLS POLICIES
-- First, drop existing problematic policies
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Create comprehensive RLS policies for users table
-- Allow authenticated users to read their own profile
CREATE POLICY "authenticated_users_select_own" ON users
FOR SELECT TO authenticated
USING (auth.uid() = auth_user_id);

-- Allow users to update their own profile
CREATE POLICY "authenticated_users_update_own" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Allow super-admins to read all users (bypass tenant restrictions)
CREATE POLICY "superadmin_select_all_users" ON users
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin'
    AND is_active = true
  )
);

-- Allow super-admins to update any user
CREATE POLICY "superadmin_update_all_users" ON users
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin'
    AND is_active = true
  )
);

-- Allow system/service role to insert new users (for user creation flow)
CREATE POLICY "service_role_insert_users" ON users
FOR INSERT TO service_role
WITH CHECK (true);

-- Allow authenticated users with proper permissions to insert users
CREATE POLICY "authenticated_insert_users" ON users
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow during signup process (user creating their own record)
  auth.uid() = auth_user_id
  OR
  -- Allow super-admins to create users
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin'
    AND is_active = true
  )
  OR
  -- Allow school admins to create users in their school
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role IN ('admin', 'principal')
    AND is_active = true
    AND preschool_id = NEW.preschool_id
  )
);

-- 2. AUTOMATIC USER CREATION TRIGGER
-- Create function to automatically create public.users record when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
  default_role TEXT;
BEGIN
  -- Get user details from auth.users
  SELECT email, raw_user_meta_data->>'name' 
  INTO user_email, user_name
  FROM auth.users 
  WHERE id = NEW.id;

  -- Determine default role based on email domain or metadata
  default_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    CASE 
      WHEN user_email LIKE '%@edudash.com' THEN 'superadmin'
      WHEN user_email LIKE '%admin%' THEN 'admin'
      ELSE 'parent'
    END
  );

  -- Insert into public.users table
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    default_role,
    true,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth user creation
  RAISE WARNING 'Failed to create public.users record for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create public.users record
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. FIX EXISTING ORPHANED USERS
-- Create public.users records for existing auth.users that don't have them
INSERT INTO public.users (
  auth_user_id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  CASE 
    WHEN au.email LIKE '%@edudash.com' THEN 'superadmin'
    WHEN au.email LIKE '%admin%' THEN 'admin'
    WHEN au.email = 'king@youngeagles.org.za' THEN 'superadmin'  -- Specific user fix
    ELSE 'parent'
  END,
  true,
  NOW(),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
WHERE pu.id IS NULL;

-- 4. SUPER-ADMIN SPECIFIC POLICIES
-- Super-admins should have access to all tenant data without subscription restrictions

-- For preschools table
DROP POLICY IF EXISTS "superadmin_access_all_preschools" ON preschools;
CREATE POLICY "superadmin_access_all_preschools" ON preschools
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin'
    AND is_active = true
  )
);

-- For lessons table (if exists)
DROP POLICY IF EXISTS "superadmin_access_all_lessons" ON lessons;
CREATE POLICY "superadmin_access_all_lessons" ON lessons
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin'
    AND is_active = true
  )
);

-- For classes table (if exists)
DROP POLICY IF EXISTS "superadmin_access_all_classes" ON classes;
CREATE POLICY "superadmin_access_all_classes" ON classes
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'superadmin'
    AND is_active = true
  )
);

-- 5. REFRESH RLS
-- Ensure RLS is enabled on critical tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE preschools ENABLE ROW LEVEL SECURITY;

-- 6. CREATE SUPER-ADMIN HELPER FUNCTION
CREATE OR REPLACE FUNCTION is_superadmin(user_auth_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = user_auth_id 
    AND role = 'superadmin'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION is_superadmin TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user TO service_role;

COMMENT ON FUNCTION is_superadmin IS 'Check if user is an active super-admin';
COMMENT ON FUNCTION handle_new_user IS 'Automatically create public.users record when auth user is created';
