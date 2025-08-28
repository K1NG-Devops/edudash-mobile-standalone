-- Simple password update for superadmin
UPDATE auth.users 
SET 
  encrypted_password = crypt('#Olivia@17', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'superadmin@edudashpro.org.za';
