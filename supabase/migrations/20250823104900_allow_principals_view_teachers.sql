-- Allow principals to view teachers in their preschool
-- This fixes the issue where teachers don't appear in the app because RLS was blocking the query

-- Create policy to allow principals to view other users (teachers) in their preschool
CREATE POLICY "Principals can view users in their preschool"
ON public.users
FOR SELECT
TO authenticated
USING (
  -- User can always see their own profile
  auth.uid() = auth_user_id
  OR
  -- Principals can see other users in their preschool
  (
    preschool_id = (
      SELECT u.preschool_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
        AND u.role IN ('principal', 'preschool_admin', 'admin', 'superadmin')
        AND u.is_active = true
    )
  )
);

-- Drop the old restrictive policy that only allowed users to see themselves
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
