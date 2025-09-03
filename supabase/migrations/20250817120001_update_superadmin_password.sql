-- Update superadmin auth user password
-- This script updates the password for the existing auth user

DO $$
DECLARE
  v_auth_user_id uuid;
BEGIN
  -- Get the auth user ID for the superadmin email
  SELECT id INTO v_auth_user_id 
  FROM auth.users 
  WHERE email = 'superadmin@edudashpro.org.za';
  
IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'Auth user not found for email: superadmin@edudashpro.org.za - skipping password update';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found auth user ID: %', v_auth_user_id;
  
  -- Update the auth user password and ensure it's confirmed
  UPDATE auth.users 
  SET 
    encrypted_password = crypt('#Olivia@17', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = v_auth_user_id;
  
  RAISE NOTICE 'Updated password for auth user %', v_auth_user_id;
  
  -- Verify the update
  SELECT id INTO v_auth_user_id
  FROM auth.users 
  WHERE email = 'superadmin@edudashpro.org.za' 
    AND email_confirmed_at IS NOT NULL;
  
  IF v_auth_user_id IS NOT NULL THEN
    RAISE NOTICE 'SUCCESS: Auth user password updated and email confirmed';
ELSE
    RAISE NOTICE 'FAILED: Could not update auth user - skipping in this environment';
  END IF;
  
END $$;
