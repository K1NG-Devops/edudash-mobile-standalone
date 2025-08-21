-- MANUAL SQL FIX for Superadmin Creation
-- Run these commands directly in Supabase Dashboard > SQL Editor
-- This will bypass all RLS policies and create the superadmin user

-- Step 1: Temporarily disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Clean up any existing superadmin records
DELETE FROM public.users WHERE email = 'superadmin@edudashpro.org.za';

-- Step 3: Create or update the preschool record
INSERT INTO public.preschools (
  id,
  name, 
  address,
  phone,
  email,
  created_at,
  updated_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'EduDash Platform Administration',
  '123 Education Street, Cape Town, South Africa',
  '+27-21-123-4567',
  'admin@edudashpro.org.za',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  updated_at = now();

-- Step 4: Create the superadmin user profile
-- Note: Replace 'YOUR_AUTH_USER_ID_HERE' with the actual auth user ID from the auth.users table
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'superadmin@edudashpro.org.za';

INSERT INTO public.users (
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
  'superadmin@edudashpro.org.za',
  'Super Admin',
  'superadmin',
  'e8a14d78-d21b-4932-aae8-d2b7f4e25159', -- This is the auth user ID we found
  '11111111-1111-1111-1111-111111111111',
  true,
  'complete',
  '+27-21-123-4567',
  now(),
  now()
);

-- Step 5: Create some essential seed data
INSERT INTO public.age_groups (id, name, min_age, max_age, min_age_months, max_age_months, description, preschool_id, created_at) VALUES
  ('22222222-2222-2222-2222-222222222221', 'Infants', 0, 1, 0, 18, 'Babies and toddlers from birth to 18 months', '11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222222', 'Toddlers', 1, 3, 18, 36, 'Active toddlers from 18 months to 3 years', '11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222223', 'Pre-K', 3, 4, 36, 48, 'Pre-kindergarten children from 3 to 4 years', '11111111-1111-1111-1111-111111111111', now()),
  ('22222222-2222-2222-2222-222222222224', 'Kindergarten', 4, 6, 48, 72, 'Kindergarten-ready children from 4 to 6 years', '11111111-1111-1111-1111-111111111111', now())
ON CONFLICT (id) DO NOTHING;

-- Step 6: Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies that work
CREATE POLICY "users_can_read_own" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "users_can_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "users_can_update_own" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- Superadmin can do everything
CREATE POLICY "superadmin_full_access" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'superadmin' 
      AND u.is_active = true
    )
  );

-- Enable RLS on other tables with basic policies
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preschools_basic_access" ON public.preschools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND (u.role = 'superadmin' OR u.preschool_id = preschools.id)
      AND u.is_active = true
    )
  );

ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "age_groups_basic_access" ON public.age_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND (u.role = 'superadmin' OR u.preschool_id = age_groups.preschool_id)
      AND u.is_active = true
    )
  );

-- Verification queries
SELECT 'Superadmin user created successfully!' as status;
SELECT id, email, name, role, auth_user_id, is_active FROM public.users WHERE email = 'superadmin@edudashpro.org.za';
SELECT 'You can now test login with: superadmin@edudashpro.org.za / #Olivia@17' as next_step;
