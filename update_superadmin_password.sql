-- ARCHIVED/DISABLED: This SQL script is disabled by default to prevent accidental execution in production.
-- Move this script to a private ops location if you truly need it, and remove this guard.
DO $$
BEGIN
  RAISE EXCEPTION 'Archived script disabled by default';
END $$;
-- ===== Original content below =====
-- Simple password update for superadmin
UPDATE auth.users 
SET 
  encrypted_password = crypt('#Olivia@17', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'superadmin@edudashpro.org.za';
