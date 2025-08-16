-- Setup test data for EduDash Pro onboarding system
-- This creates sample data needed for testing the resend functionality

BEGIN;

-- Temporarily disable RLS for data insertion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE preschools DISABLE ROW LEVEL SECURITY;
ALTER TABLE preschool_onboarding_requests DISABLE ROW LEVEL SECURITY;

-- Insert superadmin user
INSERT INTO users (id, auth_user_id, name, email, role, is_active, created_at, updated_at) 
VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  'Super Administrator',
  'admin@edudashpro.org.za',
  'superadmin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert sample onboarding requests
INSERT INTO preschool_onboarding_requests (
  id, preschool_name, admin_name, admin_email, phone, address, 
  number_of_students, number_of_teachers, message, status, created_at
) VALUES 
(
  gen_random_uuid(),
  'Sunny Side Preschool',
  'Sarah Johnson',
  'sarah@sunnysidepreschool.co.za',
  '+27 11 123 4567',
  '123 Oak Street, Johannesburg, 2000',
  45,
  6,
  'We are excited to join EduDash Pro to better manage our growing preschool.',
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Little Stars Academy',
  'Michael Thompson',
  'michael@littlestars.co.za',
  '+27 21 987 6543',
  '456 Pine Avenue, Cape Town, 8000',
  30,
  4,
  'Looking forward to digitizing our administrative processes.',
  'pending',
  NOW()
),
(
  gen_random_uuid(),
  'Rainbow Kids Preschool',
  'Lisa Williams',
  'lisa@rainbowkids.co.za',
  '+27 31 555 7890',
  '789 Elm Road, Durban, 4000',
  60,
  8,
  'We need a comprehensive solution for student and parent management.',
  'pending',
  NOW()
) ON CONFLICT (admin_email) DO NOTHING;

-- Get the superadmin ID for approval
WITH superadmin AS (
  SELECT id FROM users WHERE role = 'superadmin' LIMIT 1
),
first_request AS (
  SELECT * FROM preschool_onboarding_requests 
  WHERE admin_email = 'sarah@sunnysidepreschool.co.za' 
  LIMIT 1
)
-- Approve the first request
UPDATE preschool_onboarding_requests
SET 
  status = 'approved',
  reviewed_by = (SELECT id FROM superadmin),
  reviewed_at = NOW()
FROM first_request
WHERE preschool_onboarding_requests.id = first_request.id;

-- Create a school from the approved request
WITH approved_request AS (
  SELECT * FROM preschool_onboarding_requests 
  WHERE status = 'approved' AND admin_email = 'sarah@sunnysidepreschool.co.za'
  LIMIT 1
)
INSERT INTO preschools (
  id, name, email, phone, address, 
  subscription_status, onboarding_status, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  preschool_name,
  admin_email,
  phone,
  address,
  'active',
  'completed',
  NOW(),
  NOW()
FROM approved_request
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  subscription_status = EXCLUDED.subscription_status,
  onboarding_status = EXCLUDED.onboarding_status,
  updated_at = NOW();

-- Create an admin user for the school
WITH school AS (
  SELECT id FROM preschools WHERE email = 'sarah@sunnysidepreschool.co.za'
),
approved_request AS (
  SELECT * FROM preschool_onboarding_requests 
  WHERE status = 'approved' AND admin_email = 'sarah@sunnysidepreschool.co.za'
  LIMIT 1
)
INSERT INTO users (
  id, auth_user_id, name, email, role, preschool_id, 
  is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  gen_random_uuid(),
  admin_name,
  admin_email,
  'principal',
  (SELECT id FROM school),
  true,
  NOW(),
  NOW()
FROM approved_request
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  preschool_id = EXCLUDED.preschool_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE preschool_onboarding_requests ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Show results
SELECT 'SUMMARY' as info, 'Test data created successfully' as message;

SELECT 'SUPERADMIN' as type, name, email, role 
FROM users WHERE role = 'superadmin';

SELECT 'ONBOARDING_REQUESTS' as type, preschool_name, admin_name, status 
FROM preschool_onboarding_requests 
ORDER BY created_at DESC;

SELECT 'SCHOOLS' as type, name, email, subscription_status 
FROM preschools;

SELECT 'SCHOOL_ADMINS' as type, u.name, u.email, u.role, p.name as school_name
FROM users u 
JOIN preschools p ON u.preschool_id = p.id 
WHERE u.role IN ('principal', 'admin', 'preschool_admin');

-- Test query for resend functionality
SELECT 'RESEND_TEST' as type, 
       p.name as school_name, 
       u.name as admin_name, 
       u.email as admin_email,
       u.auth_user_id is not null as has_auth_id,
       u.is_active as is_active
FROM preschools p
JOIN users u ON u.preschool_id = p.id
WHERE u.role IN ('principal', 'admin', 'preschool_admin')
  AND u.is_active = true;
