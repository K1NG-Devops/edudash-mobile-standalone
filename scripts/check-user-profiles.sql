-- Check and fix user profiles for existing schools
-- Run this in Supabase SQL Editor

-- Check existing users and their associations
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  u.preschool_id,
  p.name as school_name,
  u.is_active,
  u.created_at
FROM public.users u
LEFT JOIN public.preschools p ON u.preschool_id = p.id
ORDER BY u.created_at DESC;

-- Find principals who should be associated with schools
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email as user_email,
  u.role,
  u.preschool_id,
  p.id as school_id,
  p.name as school_name,
  p.email as school_email
FROM public.users u
FULL OUTER JOIN public.preschools p ON u.email = p.email
WHERE u.role = 'principal' OR p.email IS NOT NULL
ORDER BY u.email, p.email;

-- Check for missing principal users for existing schools
SELECT 
  p.id,
  p.name,
  p.email,
  'No principal user found' as issue
FROM public.preschools p
LEFT JOIN public.users u ON u.email = p.email AND u.role = 'principal'
WHERE u.id IS NULL;

-- Check authentication users that might need profile creation
-- Note: This needs to be run with appropriate permissions
SELECT 
  au.email,
  au.user_metadata,
  u.id as profile_exists
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id
WHERE au.email IN (
  SELECT email FROM public.preschools
) AND u.id IS NULL;
