-- EMERGENCY RLS FIX - Stop Infinite Recursion
-- This will immediately fix the authentication issue

-- Step 1: Disable RLS completely (temporary solution)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 2: Create superadmin user immediately
INSERT INTO users (
    auth_user_id,
    email,
    name,
    role,
    is_active,
    profile_completion_status,
    created_at,
    updated_at
) VALUES (
    'temp_superadmin_emergency_' || extract(epoch from now())::bigint,
    'superadmin@edudashpro.org.za',
    'EduDash Pro Super Administrator',
    'superadmin',
    true,
    'complete',
    now(),
    now()
) 
ON CONFLICT (email) DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now();
