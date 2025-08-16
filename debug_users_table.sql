-- Test query to check users table and data
-- Run this manually in Supabase SQL editor to see what's in the users table

-- Check if users table exists and get its structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- Check what users exist
SELECT 
  id,
  email,
  name,
  role,
  preschool_id,
  auth_user_id,
  is_active,
  created_at
FROM public.users
LIMIT 10;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- Check existing policies
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
WHERE schemaname = 'public' 
AND tablename = 'users';
