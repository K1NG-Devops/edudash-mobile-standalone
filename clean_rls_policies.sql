-- Remove conflicting RLS policies that are causing issues
-- Keep only the simple, non-recursive policies

-- Drop the problematic policies on users table
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view users from their preschool" ON users;

-- Also clean up the duplicate students policy 
DROP POLICY IF EXISTS "Users can view students from their preschool" ON students;

-- Verify what policies remain
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

-- Test if we can query users table now
SELECT 'Testing users table access...' as test;
SELECT id, name, email, role FROM users LIMIT 1;
