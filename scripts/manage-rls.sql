-- Development script to temporarily manage RLS policies
-- USE WITH CAUTION: This disables security for development purposes only

-- 🚨 DEVELOPMENT ONLY: Temporarily disable RLS on users table
-- This will allow the app to function while you fix the policy issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Alternative: Enable RLS but remove the problematic policies
-- Uncomment these lines if you want to keep RLS enabled but remove the recursive policies
-- DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;

-- ✅ RECOMMENDED: Better approach - create simple, non-recursive policies
-- After dropping the problematic policies, you can create these safer ones:

-- CREATE POLICY "Enable read for authenticated users" ON users
--   FOR SELECT USING (auth.uid() = auth_user_id::uuid);

-- CREATE POLICY "Enable update for own profile" ON users
--   FOR UPDATE USING (auth.uid() = auth_user_id::uuid);

-- CREATE POLICY "Enable insert for authenticated users" ON users
--   FOR INSERT WITH CHECK (auth.uid() = auth_user_id::uuid);

-- 🔄 To re-enable RLS later (after fixing policies):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 🧹 To completely reset and start fresh with RLS policies:
-- DROP POLICY IF EXISTS "Enable read for authenticated users" ON users;
-- DROP POLICY IF EXISTS "Enable update for own profile" ON users; 
-- DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
