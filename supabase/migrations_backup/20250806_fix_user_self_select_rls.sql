-- Fix RLS SELECT policy circular dependency issue
-- Users need to be able to read their own profile before we can check preschool membership

-- Drop the existing policy that has circular dependency
DROP POLICY IF EXISTS "users_can_view_preschool_members" ON public.users;

-- First, allow users to read their own profile (essential for authentication)
CREATE POLICY "users_can_read_own_profile" ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Then, allow users to view other users in their preschool (using a subquery that works)
CREATE POLICY "users_can_view_preschool_members" ON public.users
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can see other users in their preschool
    preschool_id = (
      SELECT u.preschool_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid()
      LIMIT 1
    )
    OR
    -- Superadmins can see everything
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin'
    )
  );
