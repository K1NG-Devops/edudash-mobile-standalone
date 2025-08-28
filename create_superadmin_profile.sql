-- Create superadmin profile for existing auth user
-- Since auth user already exists, we just need to create the profile

DO $$
DECLARE
  auth_user_id uuid;
  existing_profile_id uuid;
BEGIN
  -- Get the auth user ID for the superadmin email
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@edudashpro.org.za';
  
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user not found for email: superadmin@edudashpro.org.za';
  END IF;
  
  RAISE NOTICE 'Found auth user ID: %', auth_user_id;
  
  -- Check if profile already exists
  SELECT id INTO existing_profile_id
  FROM users 
  WHERE auth_user_id = auth_user_id;
  
  IF existing_profile_id IS NOT NULL THEN
    -- Update existing profile to superadmin
    UPDATE users 
    SET 
      role = 'superadmin',
      name = 'EduDash Super Administrator',
      is_active = true,
      profile_completion_status = 'complete',
      updated_at = now()
    WHERE id = existing_profile_id;
    
    RAISE NOTICE 'Updated existing profile % to superadmin role', existing_profile_id;
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
      auth_user_id,
      true,
      'complete',
      now(),
      now()
    );
    
    RAISE NOTICE 'Created new superadmin profile for auth user %', auth_user_id;
  END IF;
  
  -- Verify the result
  SELECT id INTO existing_profile_id
  FROM users 
  WHERE auth_user_id = auth_user_id AND role = 'superadmin';
  
  IF existing_profile_id IS NOT NULL THEN
    RAISE NOTICE 'SUCCESS: Superadmin profile created/updated with ID: %', existing_profile_id;
  ELSE
    RAISE EXCEPTION 'FAILED: Could not create/update superadmin profile';
  END IF;
  
END $$;

-- Verify the superadmin user was created correctly
SELECT 
  u.id as profile_id,
  u.email,
  u.name,
  u.role,
  u.auth_user_id,
  u.is_active,
  u.profile_completion_status,
  au.email as auth_email,
  au.email_confirmed_at,
  au.created_at as auth_created_at
FROM users u
JOIN auth.users au ON u.auth_user_id = au.id
WHERE u.email = 'superadmin@edudashpro.org.za'
  AND u.role = 'superadmin';
