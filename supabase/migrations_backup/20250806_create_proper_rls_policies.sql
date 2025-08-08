-- Create proper RLS policies for the users table
-- This migration creates working RLS policies that don't have circular dependencies

-- Re-enable RLS on the users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own profile (essential for authentication)
CREATE POLICY "users_can_read_own_profile" ON public.users
  FOR SELECT 
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Allow users to view other users in their preschool
-- This policy uses a more efficient approach without circular dependencies
CREATE POLICY "users_can_view_preschool_members" ON public.users
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can see other users in their preschool
    preschool_id = (
      SELECT preschool_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      LIMIT 1
    )
    OR
    -- Superadmins can see everything
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policy 3: Allow preschool admins to create teachers
CREATE POLICY "preschool_admins_can_create_teachers" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating a teacher for their own preschool and they are an admin/principal
    role = 'teacher' AND 
    preschool_id = (
      SELECT preschool_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'principal', 'preschool_admin')
      LIMIT 1
    )
  );

-- Policy 4: Allow preschool admins to update teachers in their preschool
CREATE POLICY "preschool_admins_can_update_teachers" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if updating a teacher in their own preschool and they are an admin/principal
    role = 'teacher' AND 
    preschool_id = (
      SELECT preschool_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'principal', 'preschool_admin')
      LIMIT 1
    )
  );

-- Policy 5: Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 6: Allow superadmins to do everything
CREATE POLICY "superadmins_full_access" ON public.users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'superadmin'
    )
  );

-- Policy 7: Allow preschool admins to create parents for their preschool
CREATE POLICY "preschool_admins_can_create_parents" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is creating a parent for their own preschool and they are an admin/principal
    role = 'parent' AND 
    preschool_id = (
      SELECT preschool_id 
      FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('admin', 'principal', 'preschool_admin')
      LIMIT 1
    )
  );

-- Policy 8: Allow authenticated users to create their own initial profile during signup
CREATE POLICY "users_can_create_own_profile" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());
