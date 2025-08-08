-- Create proper tenant isolation with PostgreSQL functions and invitation system
-- This approach avoids RLS recursion while maintaining strict security

-- First, create a table for invitation codes
CREATE TABLE IF NOT EXISTS public.invitation_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'parent')),
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL, -- auth_user_id of the inviter
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamp with time zone,
  used_by uuid, -- auth_user_id of the person who used the code
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS invitation_codes_code_idx ON public.invitation_codes(code);
CREATE INDEX IF NOT EXISTS invitation_codes_email_idx ON public.invitation_codes(email);
CREATE INDEX IF NOT EXISTS invitation_codes_preschool_id_idx ON public.invitation_codes(preschool_id);

-- Enable RLS on invitation_codes
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Function to get user's preschool_id and role safely
CREATE OR REPLACE FUNCTION get_user_preschool_info(user_auth_id uuid)
RETURNS TABLE(preschool_id uuid, role text) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT u.preschool_id, u.role
  FROM public.users u
  WHERE u.auth_user_id = user_auth_id
  LIMIT 1;
END;
$$;

-- Function to check if user is admin of a preschool
CREATE OR REPLACE FUNCTION is_preschool_admin(user_auth_id uuid, target_preschool_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_info RECORD;
BEGIN
  SELECT * INTO user_info FROM get_user_preschool_info(user_auth_id);
  
  RETURN (
    user_info.preschool_id = target_preschool_id AND 
    user_info.role IN ('admin', 'principal', 'preschool_admin')
  );
END;
$$;

-- Function to generate invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code(
  p_email text,
  p_role text,
  p_preschool_id uuid
)
RETURNS text
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_user_info RECORD;
BEGIN
  -- Get current user's info
  SELECT * INTO v_user_info FROM get_user_preschool_info(auth.uid());
  
  -- Check if current user is admin of the target preschool
  IF NOT is_preschool_admin(auth.uid(), p_preschool_id) THEN
    RAISE EXCEPTION 'Access denied: You are not an admin of this preschool';
  END IF;
  
  -- Generate a unique 8-character code
  v_code := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
  
  -- Insert invitation code
  INSERT INTO public.invitation_codes (
    code,
    email,
    role,
    preschool_id,
    invited_by
  ) VALUES (
    v_code,
    p_email,
    p_role,
    p_preschool_id,
    auth.uid()
  );
  
  RETURN v_code;
END;
$$;

-- Function to use invitation code and create user
CREATE OR REPLACE FUNCTION use_invitation_code(
  p_code text,
  p_auth_user_id uuid,
  p_name text,
  p_phone text DEFAULT NULL
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_invitation RECORD;
  v_user_id uuid;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.invitation_codes
  WHERE code = p_code
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;
  
  -- Create user record
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    phone,
    role,
    preschool_id,
    is_active
  ) VALUES (
    p_auth_user_id,
    v_invitation.email,
    p_name,
    p_phone,
    v_invitation.role,
    v_invitation.preschool_id,
    true
  ) RETURNING id INTO v_user_id;
  
  -- Mark invitation as used
  UPDATE public.invitation_codes
  SET used_at = now(), used_by = p_auth_user_id
  WHERE id = v_invitation.id;
  
  RETURN v_user_id;
END;
$$;

-- Now create proper RLS policies using our functions

-- Drop existing broad policies
DROP POLICY IF EXISTS "authenticated_users_can_insert_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_update_users" ON public.users;

-- Policy for viewing users - only same preschool or own profile
CREATE POLICY "users_can_view_same_preschool" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    -- Can always see own profile
    auth_user_id = auth.uid()
    OR
    -- Can see users in same preschool
    preschool_id IN (
      SELECT p.preschool_id FROM get_user_preschool_info(auth.uid()) p
    )
    OR
    -- Superadmins can see everything
    EXISTS (
      SELECT 1 FROM get_user_preschool_info(auth.uid()) p WHERE p.role = 'superadmin'
    )
  );

-- Policy for creating users - only via invitation system or own profile
CREATE POLICY "users_can_create_via_invitation" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Can create own profile
    auth_user_id = auth.uid()
    OR
    -- Superadmins can create anyone
    EXISTS (
      SELECT 1 FROM get_user_preschool_info(auth.uid()) p WHERE p.role = 'superadmin'
    )
  );

-- Policy for updating users
CREATE POLICY "users_can_update_same_preschool" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    -- Can update own profile
    auth_user_id = auth.uid()
    OR
    -- Admins can update users in their preschool
    is_preschool_admin(auth.uid(), preschool_id)
    OR
    -- Superadmins can update anyone
    EXISTS (
      SELECT 1 FROM get_user_preschool_info(auth.uid()) p WHERE p.role = 'superadmin'
    )
  )
  WITH CHECK (
    -- Same conditions for the updated data
    auth_user_id = auth.uid()
    OR
    is_preschool_admin(auth.uid(), preschool_id)
    OR
    EXISTS (
      SELECT 1 FROM get_user_preschool_info(auth.uid()) p WHERE p.role = 'superadmin'
    )
  );

-- RLS policies for invitation_codes table
CREATE POLICY "admins_can_view_preschool_invitations" ON public.invitation_codes
  FOR SELECT
  TO authenticated
  USING (
    is_preschool_admin(auth.uid(), preschool_id)
    OR
    invited_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM get_user_preschool_info(auth.uid()) p WHERE p.role = 'superadmin'
    )
  );

CREATE POLICY "admins_can_create_invitations" ON public.invitation_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_preschool_admin(auth.uid(), preschool_id)
    OR
    EXISTS (
      SELECT 1 FROM get_user_preschool_info(auth.uid()) p WHERE p.role = 'superadmin'
    )
  );

-- Anyone can view invitations by code (for signup process)
CREATE POLICY "anyone_can_view_invitation_by_code" ON public.invitation_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_preschool_info(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_preschool_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_code(text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION use_invitation_code(text, uuid, text, text) TO authenticated;
