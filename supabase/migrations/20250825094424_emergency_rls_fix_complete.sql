-- EMERGENCY: Complete RLS fix for infinite recursion
-- This will remove ALL existing problematic policies and create clean ones

-- First, disable RLS temporarily to avoid recursion during cleanup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "users_simple_access" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "users_basic_access" ON public.users;
DROP POLICY IF EXISTS "users_superadmin_access" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users based on user_id" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;
DROP POLICY IF EXISTS "Users can read their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Policy 1: Allow users to access their own record using auth.uid()
CREATE POLICY "users_self_access" ON public.users
FOR ALL
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

-- Policy 2: Allow superadmins full access using auth.users metadata (no recursion)
CREATE POLICY "users_superadmin_full_access" ON public.users
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND (
            au.raw_user_meta_data->>'role' = 'superadmin' OR
            au.raw_user_meta_data->>'is_superadmin' = 'true'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid()
        AND (
            au.raw_user_meta_data->>'role' = 'superadmin' OR
            au.raw_user_meta_data->>'is_superadmin' = 'true'
        )
    )
);

-- Verify the fix
SELECT 'Emergency RLS fix applied successfully' as status;
