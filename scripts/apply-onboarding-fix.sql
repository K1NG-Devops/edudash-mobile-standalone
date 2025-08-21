-- Quick script to apply onboarding compatibility fix
-- Copy and paste this into Supabase SQL Editor

-- Apply the onboarding table compatibility migration
\i supabase/migrations/20250821_fix_onboarding_table_compatibility.sql

-- Verify the data is accessible
SELECT 
    'Data verification' as check_type,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE preschool_name ILIKE '%Young Eagles%') as your_request
FROM public.preschool_onboarding_requests;

-- Show your specific request details
SELECT 
    'Your request details' as info,
    id,
    preschool_name,
    admin_name,
    admin_email,
    status,
    created_at,
    phone,
    address,
    number_of_students,
    number_of_teachers
FROM public.preschool_onboarding_requests 
WHERE admin_email = 'king@youngeagles.org.za'
   OR preschool_name ILIKE '%Young Eagles%';

-- Test if the service can read it via the view
SELECT 
    'Via view' as access_method,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests
FROM public.onboarding_requests;
