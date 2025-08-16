-- Script to create a superadmin user for EduDash Pro
-- Run this in your Supabase SQL editor to create a superadmin user

BEGIN;

-- First, disable RLS temporarily for the insert
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Insert a superadmin user
-- Note: You'll need to create the auth user first in Supabase Auth
INSERT INTO public.users (
    id,
    auth_user_id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    gen_random_uuid(), -- Replace this with the actual auth user ID after creating the auth user
    'Super Administrator',
    'admin@edudashpro.org.za',
    'superadmin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify the superadmin was created
SELECT id, name, email, role, is_active, created_at 
FROM users 
WHERE role = 'superadmin' 
ORDER BY created_at DESC 
LIMIT 5;
