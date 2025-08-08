-- Debug user access issues by simplifying RLS policies
-- Let's start with the most basic policy and build up

-- First, let's see what policies currently exist
-- DROP ALL existing policies to start fresh
DROP POLICY IF EXISTS "users_can_read_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_view_preschool_members" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_create_teachers" ON public.users;
DROP POLICY IF EXISTS "preschool_admins_can_update_teachers" ON public.users;

-- Temporarily disable RLS to test if this is the core issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Check if the issue persists without RLS
-- If it works, then we know it's an RLS policy issue
-- If it still fails, then it's a different problem (like column permissions, function access, etc.)
