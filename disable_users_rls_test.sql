-- Temporarily disable RLS on users table to test if it's the source of recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Add basic permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

SELECT 'RLS disabled on users table for testing' as status;
