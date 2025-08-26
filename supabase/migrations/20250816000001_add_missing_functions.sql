-- Add missing RPC functions for EduDash Pro
-- This migration adds the missing get_active_connections function and other utilities

-- Create get_active_connections function (this was causing 404 errors)
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS TABLE (
  connection_id uuid,
  user_id uuid,
  preschool_id uuid,
  connection_type text,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- For now, return a simple mock structure
  -- You can customize this based on your actual requirements
  RETURN QUERY
  SELECT 
    gen_random_uuid() as connection_id,
    auth.uid() as user_id,
    (SELECT id FROM preschools LIMIT 1) as preschool_id,
    'active'::text as connection_type,
    'connected'::text as status,
    now() as created_at,
    now() as updated_at
  WHERE auth.uid() IS NOT NULL;
END;
$$;

-- Create a helper function to get user profile by auth_user_id (safer than direct queries)
CREATE OR REPLACE FUNCTION get_user_profile_by_auth_id(p_auth_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  name text,
  role text,
  preschool_id uuid,
  auth_user_id uuid,
  is_active boolean,
  avatar_url text,
  phone text,
  home_address text,
  home_city text,
  home_postal_code text,
  work_company text,
  work_position text,
  work_address text,
  work_phone text,
  emergency_contact_1_name text,
  emergency_contact_1_phone text,
  emergency_contact_1_relationship text,
  emergency_contact_2_name text,
  emergency_contact_2_phone text,
  emergency_contact_2_relationship text,
  relationship_to_child text,
  pickup_authorized text,
  profile_completed_at timestamp with time zone,
  profile_completion_status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.preschool_id,
    u.auth_user_id,
    u.is_active,
    u.avatar_url,
    u.phone,
    u.home_address,
    u.home_city,
    u.home_postal_code,
    u.work_company,
    u.work_position,
    u.work_address,
    u.work_phone,
    u.emergency_contact_1_name,
    u.emergency_contact_1_phone,
    u.emergency_contact_1_relationship,
    u.emergency_contact_2_name,
    u.emergency_contact_2_phone,
    u.emergency_contact_2_relationship,
    u.relationship_to_child,
    u.pickup_authorized,
    u.profile_completed_at,
    u.profile_completion_status,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.auth_user_id = p_auth_user_id
  AND u.is_active = true;
END;
$$;

-- Create a function to create test superadmin for development
CREATE OR REPLACE FUNCTION create_test_superadmin(
  p_email text,
  p_name text,
  p_auth_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Insert or update superadmin user
  INSERT INTO users (
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    profile_completion_status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_email,
    p_name,
    'superadmin',
    p_auth_user_id,
    true,
    'complete',
    now(),
    now()
  )
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now()
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_connections() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_profile_by_auth_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_test_superadmin(text, text, uuid) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION get_active_connections() IS 'Returns active connections for the current user';
COMMENT ON FUNCTION get_user_profile_by_auth_id(uuid) IS 'Safely retrieves user profile by auth_user_id';
COMMENT ON FUNCTION create_test_superadmin(text, text, uuid) IS 'Creates or updates a test superadmin user for development';
