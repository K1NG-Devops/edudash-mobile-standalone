-- Comprehensive RLS fix and superadmin creation script
-- This should be run with elevated privileges (service_role key or SQL editor)

-- Step 1: Drop all existing restrictive policies on users table
DROP POLICY IF EXISTS "users_can_view_same_preschool" ON public.users;
DROP POLICY IF EXISTS "users_can_create_via_invitation" ON public.users;
DROP POLICY IF EXISTS "users_can_update_same_preschool" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_data" ON public.users;
DROP POLICY IF EXISTS "allow_superadmin_bootstrap" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_insert_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_users" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_update_users" ON public.users;

-- Step 2: Temporarily disable RLS completely
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 3: Clean up any existing superadmin records
DELETE FROM public.users WHERE email = 'superadmin@edudashpro.org.za';

-- Step 4: Ensure preschools table has data for superadmin
INSERT INTO public.preschools (
  id,
  name, 
  address,
  phone,
  email,
  is_active,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'EduDash Platform Administration',
  '123 Education Street, Cape Town, South Africa',
  '+27-21-123-4567',
  'admin@edudashpro.org.za',
  true,
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = now();

-- Step 5: Insert essential age groups
INSERT INTO public.age_groups (id, name, min_age, max_age, min_age_months, max_age_months, description, preschool_id, created_at) VALUES
  ('22222222-2222-2222-2222-222222222221', 'Infants', 0, 1, 0, 18, 'Babies and toddlers from birth to 18 months', '11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222222', 'Toddlers', 1, 3, 18, 36, 'Active toddlers from 18 months to 3 years', '11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222223', 'Pre-K', 3, 4, 36, 48, 'Pre-kindergarten children from 3 to 4 years', '11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222224', 'Kindergarten', 4, 6, 48, 72, 'Kindergarten-ready children from 4 to 6 years', '11111111-1111-1111-1111-111111111111', now())
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create the superadmin user record (this will be linked to auth user via script)
-- Note: The auth_user_id will be updated by the Node.js script after auth user creation
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  auth_user_id,
  preschool_id,
  is_active,
  profile_completion_status,
  phone,
  created_at,
  updated_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'superadmin@edudashpro.org.za',
  'Super Admin',
  'superadmin',
  '00000000-0000-0000-0000-000000000000', -- Placeholder, will be updated
  '11111111-1111-1111-1111-111111111111',
  true,
  'complete',
  '+27-21-123-4567',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  profile_completion_status = EXCLUDED.profile_completion_status,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Step 7: Re-enable RLS with more permissive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 8: Create simplified RLS policies that actually work

-- Policy 1: Allow users to see their own records
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Policy 2: Allow superadmins to see all users
CREATE POLICY "superadmin_select_all" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
  );

-- Policy 3: Allow users in same preschool to see each other
CREATE POLICY "preschool_users_select" ON public.users
  FOR SELECT
  TO authenticated
  USING (
    preschool_id IN (
      SELECT u.preschool_id FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.is_active = true
    )
  );

-- Policy 4: Allow authenticated users to insert their own profile
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 5: Allow superadmins to insert any user
CREATE POLICY "superadmin_insert_all" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
    OR auth_user_id = auth.uid()
  );

-- Policy 6: Allow users to update their own records
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Policy 7: Allow superadmins to update any user
CREATE POLICY "superadmin_update_all" ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
    OR auth_user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
    OR auth_user_id = auth.uid()
  );

-- Step 9: Set up policies for other essential tables
-- Preschools policies
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preschools_select_own" ON public.preschools
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT u.preschool_id FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.is_active = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
  );

-- Age groups policies
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "age_groups_select_preschool" ON public.age_groups
  FOR SELECT
  TO authenticated
  USING (
    preschool_id IN (
      SELECT u.preschool_id FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.is_active = true
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
  );

-- Completed message
SELECT 'RLS policies have been completely reset and fixed!' as status;
SELECT 'Superadmin user placeholder created - run the Node.js script to complete setup' as next_step;
