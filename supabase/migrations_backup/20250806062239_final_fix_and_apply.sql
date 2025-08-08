-- Final migration to clean up and ensure everything works
-- Drop all potentially conflicting policies first

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "authenticated_users_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "users_can_view_preschool_members" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_teachers" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_update_teachers" ON public.users;
DROP POLICY IF EXISTS "superadmins_full_access" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_parents" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_insert_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_view_preschool_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_create_preschool_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_update_preschool_users" ON public.users;

-- Create clean, working RLS policies
-- Policy 1: Users can view their own data
CREATE POLICY "users_can_view_own_data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Users can update their own data  
CREATE POLICY "users_can_update_own_data" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 3: Allow preschool admins to view/manage users in their preschool
CREATE POLICY "preschool_admins_can_manage_preschool_users" ON public.users
  FOR ALL
  TO authenticated
  USING (
    preschool_id IN (
      SELECT u.preschool_id FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('admin', 'principal')
    )
  )
  WITH CHECK (
    preschool_id IN (
      SELECT u.preschool_id FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('admin', 'principal')
    )
  );

-- Policy 4: Allow teachers to view other users in their preschool (for class management)
CREATE POLICY "teachers_can_view_preschool_users" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    preschool_id IN (
      SELECT u.preschool_id FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'teacher'
    )
  );

-- Create the invitation system functions
CREATE OR REPLACE FUNCTION public.create_teacher_invitation(
  p_preschool_id uuid,
  p_email text,
  p_invited_by uuid
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_invitation_id uuid;
BEGIN
  -- Generate a unique invitation code
  v_code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Insert invitation
  INSERT INTO public.school_invitation_codes (
    preschool_id,
    code,
    invitation_type,
    invited_email,
    invited_by,
    expires_at
  ) VALUES (
    p_preschool_id,
    v_code,
    'teacher',
    p_email,
    p_invited_by,
    now() + interval '7 days'
  ) RETURNING id INTO v_invitation_id;
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'code', v_code,
    'expires_at', now() + interval '7 days'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_parent_invitation(
  p_preschool_id uuid,
  p_student_id uuid,
  p_email text,
  p_student_name text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_invitation_id uuid;
BEGIN
  -- Generate a unique parent access code
  v_code := upper(substring(md5(random()::text) from 1 for 6));
  
  -- Insert parent access code
  INSERT INTO public.parent_access_codes (
    preschool_id,
    student_id,
    code,
    parent_email,
    student_name,
    expires_at
  ) VALUES (
    p_preschool_id,
    p_student_id,
    v_code,
    p_email,
    p_student_name,
    now() + interval '30 days'
  ) RETURNING id INTO v_invitation_id;
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'code', v_code,
    'expires_at', now() + interval '30 days'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_invitation_code(
  p_code text,
  p_email text
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_parent_code record;
BEGIN
  -- First try teacher/admin invitations
  SELECT * INTO v_invitation
  FROM public.school_invitation_codes
  WHERE code = p_code 
    AND invited_email = p_email
    AND is_active = true
    AND expires_at > now()
    AND current_uses < max_uses;
    
  IF FOUND THEN
    RETURN json_build_object(
      'valid', true,
      'type', 'teacher',
      'preschool_id', v_invitation.preschool_id,
      'invitation_type', v_invitation.invitation_type
    );
  END IF;
  
  -- Try parent access codes
  SELECT * INTO v_parent_code
  FROM public.parent_access_codes
  WHERE code = p_code 
    AND parent_email = p_email
    AND is_active = true
    AND expires_at > now()
    AND used_at IS NULL;
    
  IF FOUND THEN
    RETURN json_build_object(
      'valid', true,
      'type', 'parent',
      'preschool_id', v_parent_code.preschool_id,
      'student_id', v_parent_code.student_id,
      'student_name', v_parent_code.student_name
    );
  END IF;
  
  RETURN json_build_object('valid', false, 'message', 'Invalid or expired invitation code');
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_teacher_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_parent_invitation TO authenticated;  
GRANT EXECUTE ON FUNCTION public.validate_invitation_code TO authenticated;

SELECT 'Database restoration and invitation system completed successfully!' as status;
