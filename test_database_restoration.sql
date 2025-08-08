-- Test script to verify the database restoration and invitation system
-- This will be run in the app to confirm everything is working

-- Check if key restored tables exist
SELECT 'addresses' as table_name, count(*) as exists FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addresses'
UNION ALL
SELECT 'emergency_contacts', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'emergency_contacts'
UNION ALL
SELECT 'messages', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages'
UNION ALL
SELECT 'school_invitation_codes', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'school_invitation_codes'
UNION ALL
SELECT 'parent_access_codes', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parent_access_codes'
UNION ALL
SELECT 'payment_methods', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods'
UNION ALL
SELECT 'payment_fees', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_fees'
UNION ALL
SELECT 'payments', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments'
UNION ALL
SELECT 'media_uploads', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'media_uploads'
UNION ALL
SELECT 'user_preferences', count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_preferences';

-- Check if invitation functions exist
SELECT 'create_teacher_invitation' as function_name, count(*) as exists FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'create_teacher_invitation'
UNION ALL
SELECT 'create_parent_invitation', count(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'create_parent_invitation'
UNION ALL
SELECT 'validate_invitation_code', count(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'validate_invitation_code';
