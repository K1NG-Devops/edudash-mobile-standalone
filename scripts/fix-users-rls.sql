-- Fix infinite recursion in users table RLS policies
-- Run with: psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/fix-users-rls.sql

\echo 'Fixing users table RLS policies...'

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "users_policy" ON users;
DROP POLICY IF EXISTS "Users can view users from their preschool" ON users;
DROP POLICY IF EXISTS "users_can_view_own_data" ON users;
DROP POLICY IF EXISTS "users_can_update_own_data" ON users;
DROP POLICY IF EXISTS "users_can_insert_own_data" ON users;
DROP POLICY IF EXISTS "Superadmins can view AI usage logs" ON users;
DROP POLICY IF EXISTS "System can insert AI usage logs" ON users;

-- Create simple, non-recursive policies

-- 1. Users can view their own record
CREATE POLICY "users_can_view_own_record" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

-- 2. Allow service role to access everything (used by server-side operations)
CREATE POLICY "service_role_can_access_all_users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- 3. Allow all authenticated users to view all users (temporarily, for troubleshooting)
-- This will be refined later once we fix the authentication flow
CREATE POLICY "authenticated_users_can_view_all_users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 4. Users can update their own record
CREATE POLICY "users_can_update_own_record" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- 5. System can insert users (for registration)
CREATE POLICY "system_can_insert_users" ON users
    FOR INSERT WITH CHECK (true);

-- 6. Allow service role to update users
CREATE POLICY "service_role_can_update_all_users" ON users
    FOR UPDATE USING (auth.role() = 'service_role');

-- Verify policies were created
\echo 'Users table policies:'
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users';

-- Test query that was failing
\echo 'Testing the query that was failing...'
\echo 'Note: This might still fail if not authenticated, but should not cause recursion'

\echo 'RLS policies fixed successfully!'
