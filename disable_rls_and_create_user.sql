-- Fix RLS and create superadmin user
-- Run this in Supabase SQL Editor

-- 1. Completely disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Delete any existing superadmin users
DELETE FROM public.users WHERE email = 'superadmin@edudashpro.org.za';

-- 3. Insert the superadmin user with the correct current auth_user_id
-- Replace 'e8a14d78-d21b-4932-aae8-d2b7f4e25159' with the current auth user ID from the script output
INSERT INTO public.users (
    email,
    name,
    role,
    auth_user_id,
    is_active,
    profile_completion_status
) VALUES (
    'superadmin@edudashpro.org.za',
    'Super Admin',
    'superadmin',
    'e8a14d78-d21b-4932-aae8-d2b7f4e25159',
    true,
    'complete'
);

-- 4. Verify the user was created
SELECT 
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    created_at
FROM public.users 
WHERE email = 'superadmin@edudashpro.org.za';
