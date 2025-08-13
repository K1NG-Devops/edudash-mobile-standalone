-- Fix RLS policies for users table to prevent infinite recursion
-- This script will drop existing problematic policies and create proper ones

-- First, let's drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Parents can view their children" ON users;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Create simple, non-recursive RLS policies for users table
-- Policy for users to view their own profile
CREATE POLICY "users_select_own" ON users
    FOR SELECT
    USING (auth.uid() = auth_user_id);

-- Policy for users to update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- Policy for users to insert their own profile (for registration)
CREATE POLICY "users_insert_own" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = auth_user_id);

-- Ensure RLS is enabled on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Let's also check if there are any issues with other related tables
-- Fix students table RLS if needed
DROP POLICY IF EXISTS "Parents can view their children" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;

-- Simple policy for students - parents can view their children
CREATE POLICY "students_parent_access" ON students
    FOR SELECT
    USING (
        parent_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Ensure RLS is enabled on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Verify the policies are working
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'students')
ORDER BY tablename, policyname;
