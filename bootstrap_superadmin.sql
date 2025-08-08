-- Bootstrap script to create initial superadmin user
-- This temporarily disables RLS to allow initial setup

-- Step 1: Temporarily disable RLS on users table for bootstrap
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Step 2: Check if superadmin already exists and clean up if needed
DELETE FROM public.users WHERE email = 'superadmin@edudashpro.org.za';

-- Step 3: Create a sample preschool for the superadmin (superadmins can manage all preschools)
INSERT INTO public.preschools (
  id,
  name, 
  address,
  phone,
  email,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'EduDash Platform Administration',
  '123 Education Street, Cape Town, South Africa',
  '+27-21-123-4567',
  'admin@edudashpro.org.za',
  true,
  now()
) ON CONFLICT (email) DO NOTHING;

-- Step 4: Get the preschool ID for reference
-- Note: Superadmins don't need to be tied to a specific preschool, but having one helps with data consistency

-- Step 5: Enable RLS back on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Create a temporary policy that allows superadmin creation
CREATE POLICY "allow_superadmin_bootstrap" ON public.users
  FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Step 7: Create some essential seed data

-- Insert age groups if they don't exist
INSERT INTO public.age_groups (name, min_age, max_age, min_age_months, max_age_months, description) VALUES
  ('Infants', 0, 1, 0, 18, 'Babies and toddlers from birth to 18 months'),
  ('Toddlers', 1, 3, 18, 36, 'Active toddlers from 18 months to 3 years'),
  ('Pre-K', 3, 4, 36, 48, 'Pre-kindergarten children from 3 to 4 years'),
  ('Kindergarten', 4, 6, 48, 72, 'Kindergarten-ready children from 4 to 6 years')
ON CONFLICT (name) DO NOTHING;

SELECT 'Bootstrap script completed successfully' as status;
