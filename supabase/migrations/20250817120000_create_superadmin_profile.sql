-- Migration: Create superadmin profile for existing auth user
-- Since auth user already exists, we just need to create the profile

DO $$
DECLARE
  v_auth_user_id uuid;
  v_existing_profile_id uuid;
BEGIN
  -- Get the auth user ID for the superadmin email
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@edudashpro.org.za';
  
  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Auth user not found for email: superadmin@edudashpro.org.za - skipping profile creation';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found auth user ID: %', v_auth_user_id;
  
  -- Check if profile already exists
  SELECT id INTO v_existing_profile_id
  FROM users 
  WHERE auth_user_id = v_auth_user_id;
  
  IF v_existing_profile_id IS NOT NULL THEN
    -- Update existing profile to superadmin
    UPDATE users 
    SET 
      role = 'superadmin',
      name = 'EduDash Super Administrator',
      is_active = true,
      profile_completion_status = 'complete',
      updated_at = now()
    WHERE id = v_existing_profile_id;
    
    RAISE NOTICE 'Updated existing profile % to superadmin role', v_existing_profile_id;
  ELSE
    -- Create new profile for the auth user
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
      'superadmin@edudashpro.org.za',
      'EduDash Super Administrator',
      'superadmin',
      v_auth_user_id,
      true,
      'complete',
      now(),
      now()
    );
    
    RAISE NOTICE 'Created new superadmin profile for auth user %', v_auth_user_id;
  END IF;
  
END $$;
