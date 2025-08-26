-- ARCHIVED/DISABLED: This SQL script is disabled by default to prevent accidental execution in production.
-- Move this script to a private ops location if you truly need it, and remove this guard.
DO $$
BEGIN
  RAISE EXCEPTION 'Archived script disabled by default';
END $$;
-- ===== Original content below =====
-- Create superadmin user with specific credentials
-- This script creates the auth user and corresponding profile

-- First, let's create a function to create the complete superadmin setup
CREATE OR REPLACE FUNCTION create_specific_superadmin(
  p_email text,
  p_name text DEFAULT 'EduDash Super Administrator'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  user_id uuid;
  result_message text;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF auth_user_id IS NOT NULL THEN
    -- User exists in auth, now check/create profile
    SELECT id INTO user_id
    FROM users 
    WHERE auth_user_id = auth_user_id;
    
    IF user_id IS NOT NULL THEN
      -- Update existing user to superadmin
      UPDATE users 
      SET 
        role = 'superadmin',
        is_active = true,
        updated_at = now()
      WHERE id = user_id;
      
      result_message := 'Existing user updated to superadmin';
    ELSE
      -- Create new profile for existing auth user
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
        auth_user_id,
        true,
        'complete',
        now(),
        now()
      )
      RETURNING id INTO user_id;
      
      result_message := 'Profile created for existing auth user';
    END IF;
  ELSE
    -- Auth user doesn't exist, we need to insert manually into auth.users
    -- Generate a new UUID for the auth user
    auth_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this is unusual but needed for setup)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      auth_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt('#Olivia@17', gen_salt('bf')), -- Hash the password
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
    
    -- Create the corresponding profile
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
      auth_user_id,
      true,
      'complete',
      now(),
      now()
    )
    RETURNING id INTO user_id;
    
    result_message := 'Complete superadmin user created (auth + profile)';
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', result_message,
    'auth_user_id', auth_user_id,
    'profile_user_id', user_id,
    'email', p_email
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error: ' || SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;

-- Execute the function to create the superadmin
SELECT create_specific_superadmin('superadmin@edudashpro.org.za', 'EduDash Super Administrator');
