-- Fix RLS policy for users table to allow preschool admins to create teachers
-- This allows principals/admins to create user records for teachers in their preschool

-- Drop the existing users policy
DROP POLICY IF EXISTS "users_policy" ON public.users;

-- Create a new policy that allows:
-- 1. Users to see their own profile
-- 2. Superadmins to see/modify everything  
-- 3. Users to see other users in their preschool
-- 4. Preschool admins to create teachers for their preschool
CREATE POLICY "users_comprehensive_policy" ON public.users
  USING (
    -- Users can see their own profile
    auth.uid() = auth_user_id OR
    -- Superadmins can see everything
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin'
    ) OR
    -- Users can see other users in their preschool
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.preschool_id = users.preschool_id
    )
  )
  WITH CHECK (
    -- Users can update their own profile
    auth.uid() = auth_user_id OR
    -- Superadmins can modify everything
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin'
    ) OR
    -- Preschool admins can create/modify users in their preschool
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('admin', 'principal') 
      AND u.preschool_id = users.preschool_id
    )
  );

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
