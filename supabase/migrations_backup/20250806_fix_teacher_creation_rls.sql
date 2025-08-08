-- Add RLS policy to allow preschool admins to create teachers
-- This migration fixes the issue where principals/admins can't create teacher records

-- First, let's add a policy that allows preschool admins to insert users (teachers) for their preschool
CREATE POLICY "preschool_admins_can_create_teachers" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating a teacher for their own preschool and they are an admin/principal
    role = 'teacher' AND 
    preschool_id IN (
      SELECT u.preschool_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('admin', 'principal', 'preschool_admin')
    )
  );

-- Add a policy that allows preschool users to view other users in their preschool
CREATE POLICY "users_can_view_preschool_members" ON public.users
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can see other users in their preschool
    preschool_id IN (
      SELECT u.preschool_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid()
    )
    OR
    -- Superadmins can see everything
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin'
    )
  );

-- Add a policy that allows preschool admins to update teachers in their preschool
CREATE POLICY "preschool_admins_can_update_teachers" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if updating a teacher in their own preschool and they are an admin/principal
    role = 'teacher' AND 
    preschool_id IN (
      SELECT u.preschool_id 
      FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('admin', 'principal', 'preschool_admin')
    )
  );

-- Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
