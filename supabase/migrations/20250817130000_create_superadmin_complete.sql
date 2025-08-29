-- Create superadmin auth user and profile
-- This creates the superadmin from scratch

DO $$
DECLARE
  v_auth_user_id uuid;
  v_profile_id uuid;
BEGIN
  -- Check if auth user already exists
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@edudashpro.org.za';
  
  IF v_auth_user_id IS NULL THEN
    -- Create the auth user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'superadmin@edudashpro.org.za',
      crypt('#Olivia@17', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "superadmin"}',
      false,
      'authenticated'
    ) RETURNING id INTO v_auth_user_id;
    
    RAISE NOTICE 'Created auth user with ID: %', v_auth_user_id;
  ELSE
    RAISE NOTICE 'Auth user already exists with ID: %', v_auth_user_id;
  END IF;
  
  -- Check if profile exists
  SELECT id INTO v_profile_id
  FROM users 
  WHERE auth_user_id = v_auth_user_id;
  
  IF v_profile_id IS NULL THEN
    -- Create the profile
    INSERT INTO users (
      id,
      auth_user_id,
      email,
      name,
      role,
      is_active,
      profile_completion_status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_auth_user_id,
      'superadmin@edudashpro.org.za',
      'EduDash Super Administrator',
      'superadmin',
      true,
      'complete',
      now(),
      now()
    ) RETURNING id INTO v_profile_id;
    
    RAISE NOTICE 'Created profile with ID: %', v_profile_id;
  ELSE
    -- Update existing profile
    UPDATE users 
    SET 
      role = 'superadmin',
      name = 'EduDash Super Administrator',
      is_active = true,
      profile_completion_status = 'complete',
      updated_at = now()
    WHERE id = v_profile_id;
    
    RAISE NOTICE 'Updated existing profile with ID: %', v_profile_id;
  END IF;
  
  RAISE NOTICE 'SUCCESS: Superadmin setup complete';
  
END $$;
