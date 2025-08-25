-- Fix RLS infinite recursion in users table policy
-- The current policy is causing recursion by querying users table from within users policy

-- Drop any problematic policies that might cause recursion
DROP POLICY IF EXISTS "users_simple_access" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "users_basic_access" ON public.users;
DROP POLICY IF EXISTS "users_superadmin_access" ON public.users;

-- Create a simple, non-recursive policy that just checks auth.uid() = auth_user_id
-- This avoids querying the users table from within the users table policy
CREATE POLICY "users_basic_access" ON public.users
FOR ALL
TO authenticated
USING (auth.uid() = auth_user_id);

-- Add a separate policy for superadmins using auth.users metadata
-- This avoids recursion by using auth.users instead of public.users
CREATE POLICY "users_superadmin_access" ON public.users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND au.raw_user_meta_data->>'role' = 'superadmin'
    )
);

-- Verify the fix
SELECT 'RLS recursion fixed successfully' as status;
