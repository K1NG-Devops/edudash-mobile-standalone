-- Comprehensive Data Validation Report
-- Run this in Supabase SQL Editor to identify all issues

-- 1. Preschools Data Quality Check
SELECT 
  'PRESCHOOLS' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_slug IS NULL THEN 1 END) as missing_tenant_slug,
  COUNT(CASE WHEN subscription_plan IS NULL THEN 1 END) as missing_subscription_plan,
  COUNT(CASE WHEN subscription_status IS NULL THEN 1 END) as missing_subscription_status,
  COUNT(CASE WHEN setup_completed IS NULL OR setup_completed = false THEN 1 END) as not_setup_completed,
  COUNT(CASE WHEN onboarding_status IS NULL THEN 1 END) as missing_onboarding_status,
  COUNT(CASE WHEN billing_email IS NULL THEN 1 END) as missing_billing_email,
  COUNT(CASE WHEN subscription_start_date IS NULL THEN 1 END) as missing_start_date,
  COUNT(CASE WHEN subscription_end_date IS NULL THEN 1 END) as missing_end_date
FROM public.preschools;

-- 2. User-School Association Issues
SELECT 
  'USER_SCHOOL_ASSOCIATIONS' as check_type,
  COUNT(*) as total_issues
FROM (
  -- Schools without principals
  SELECT p.id, p.name, 'No principal user' as issue_type
  FROM public.preschools p
  LEFT JOIN public.users u ON u.email = p.email AND u.role = 'principal'
  WHERE u.id IS NULL
  
  UNION ALL
  
  -- Principals without schools
  SELECT NULL, u.email, 'Principal without school' as issue_type  
  FROM public.users u
  WHERE u.role = 'principal' AND u.preschool_id IS NULL
  
  UNION ALL
  
  -- Users with invalid school references
  SELECT u.preschool_id, u.email, 'Invalid school reference' as issue_type
  FROM public.users u
  LEFT JOIN public.preschools p ON u.preschool_id = p.id
  WHERE u.preschool_id IS NOT NULL AND p.id IS NULL
) issues;

-- 3. Detailed Issues Report
SELECT 
  'DETAILED_ISSUES' as report_type,
  p.id as school_id,
  p.name as school_name,
  p.email as school_email,
  CASE 
    WHEN p.tenant_slug IS NULL THEN 'Missing tenant_slug; '
    ELSE ''
  END ||
  CASE 
    WHEN p.subscription_plan IS NULL THEN 'Missing subscription_plan; '
    ELSE ''
  END ||
  CASE 
    WHEN p.subscription_status IS NULL THEN 'Missing subscription_status; '
    ELSE ''
  END ||
  CASE 
    WHEN p.setup_completed IS NULL OR p.setup_completed = false THEN 'Not setup completed; '
    ELSE ''
  END ||
  CASE 
    WHEN p.onboarding_status IS NULL THEN 'Missing onboarding_status; '
    ELSE ''
  END ||
  CASE 
    WHEN p.billing_email IS NULL THEN 'Missing billing_email; '
    ELSE ''
  END ||
  CASE 
    WHEN u.id IS NULL THEN 'No principal user found; '
    ELSE ''
  END as issues
FROM public.preschools p
LEFT JOIN public.users u ON u.email = p.email AND u.role = 'principal'
WHERE 
  p.tenant_slug IS NULL 
  OR p.subscription_plan IS NULL 
  OR p.subscription_status IS NULL 
  OR p.setup_completed IS NULL 
  OR p.setup_completed = false
  OR p.onboarding_status IS NULL 
  OR p.billing_email IS NULL
  OR u.id IS NULL;

-- 4. Onboarding Requests Status
SELECT 
  'ONBOARDING_REQUESTS' as check_type,
  status,
  COUNT(*) as count
FROM public.preschool_onboarding_requests
GROUP BY status
ORDER BY status;

-- 5. Registration Numbers Check
SELECT 
  'REGISTRATION_NUMBERS' as check_type,
  p.name,
  p.registration_number,
  CASE 
    WHEN p.registration_number IS NULL THEN 'Missing registration number'
    WHEN LENGTH(p.registration_number) < 5 THEN 'Registration number too short'
    ELSE 'OK'
  END as status
FROM public.preschools p;
