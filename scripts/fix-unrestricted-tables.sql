-- Helper script to fix unrestricted tables and verify results
-- Run this in Supabase SQL Editor or via psql

-- ===============================================
-- CHECK CURRENT STATUS
-- ===============================================

SELECT 
    '=== BEFORE: Current RLS Status ===' as status;

SELECT 
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status,
    (
      SELECT COUNT(*) 
      FROM pg_policies p 
      WHERE p.schemaname = 'public' 
      AND p.tablename = c.relname
    ) as policy_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE 'sql_%'
  AND c.relname IN (
    'lesson_categories', 
    'age_groups', 
    'school_invitation_codes',
    'activities',
    'ai_usage_logs'
  )
ORDER BY c.relname;

-- ===============================================
-- APPLY FIXES
-- ===============================================

-- Apply the RLS migration
\i supabase/migrations/20250821_fix_unrestricted_tables_rls.sql

-- ===============================================
-- VERIFY RESULTS
-- ===============================================

SELECT 
    '=== AFTER: Updated RLS Status ===' as status;

-- Check that all critical tables now have RLS enabled
WITH rls_check AS (
  SELECT 
      c.relname as table_name,
      c.relrowsecurity as rls_enabled,
      (
        SELECT COUNT(*) 
        FROM pg_policies p 
        WHERE p.schemaname = 'public' 
        AND p.tablename = c.relname
      ) as policy_count
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE 'sql_%'
)
SELECT 
    table_name,
    CASE WHEN rls_enabled THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status,
    policy_count,
    CASE 
      WHEN rls_enabled AND policy_count > 0 THEN '✅ SECURE'
      WHEN rls_enabled AND policy_count = 0 THEN '⚠️ NO POLICIES' 
      ELSE '❌ VULNERABLE'
    END as security_status
FROM rls_check
ORDER BY 
  CASE WHEN rls_enabled THEN 0 ELSE 1 END,
  table_name;

-- ===============================================
-- SPECIFIC TABLE CHECKS
-- ===============================================

SELECT '=== Reference Tables Security Status ===' as check_type;

-- Check lesson_categories
SELECT 
  'lesson_categories' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'lesson_categories'
    AND policyname = 'authenticated_users_select_lesson_categories'
  ) THEN '✅ Read Policy Applied' ELSE '❌ Missing Read Policy' END as read_policy,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'lesson_categories'
    AND policyname = 'superadmin_manage_lesson_categories'
  ) THEN '✅ Admin Policy Applied' ELSE '❌ Missing Admin Policy' END as admin_policy;

-- Check age_groups
SELECT 
  'age_groups' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'age_groups'
    AND policyname = 'authenticated_users_select_age_groups'
  ) THEN '✅ Read Policy Applied' ELSE '❌ Missing Read Policy' END as read_policy,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'age_groups'
    AND policyname = 'superadmin_manage_age_groups'
  ) THEN '✅ Admin Policy Applied' ELSE '❌ Missing Admin Policy' END as admin_policy;

-- Check school_invitation_codes
SELECT 
  'school_invitation_codes' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'school_invitation_codes'
  ) THEN '✅ Has Policies' ELSE '❌ Missing Policies' END as has_policies;

-- ===============================================
-- SECURITY SUMMARY
-- ===============================================

SELECT '=== FINAL SECURITY SUMMARY ===' as summary_type;

WITH security_summary AS (
  SELECT 
    COUNT(*) as total_tables,
    COUNT(*) FILTER (WHERE c.relrowsecurity) as tables_with_rls,
    COUNT(*) FILTER (WHERE c.relrowsecurity AND EXISTS (
      SELECT 1 FROM pg_policies p 
      WHERE p.schemaname = 'public' 
      AND p.tablename = c.relname
    )) as tables_with_policies,
    COUNT(*) FILTER (WHERE NOT c.relrowsecurity) as vulnerable_tables
  FROM pg_class c
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' 
    AND c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
    AND c.relname NOT LIKE 'sql_%'
)
SELECT 
  total_tables || ' total tables' as metric,
  tables_with_rls || ' tables with RLS enabled' as rls_enabled,
  tables_with_policies || ' tables with policies' as policies_applied,
  CASE 
    WHEN vulnerable_tables = 0 THEN '✅ ALL TABLES SECURED'
    ELSE '⚠️ ' || vulnerable_tables || ' TABLES STILL VULNERABLE'
  END as security_status
FROM security_summary;

-- List any remaining unrestricted tables
SELECT '=== Remaining Unrestricted Tables ===' as remaining_check;

SELECT 
  c.relname as table_name,
  'Still needs RLS policies' as issue
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE 'sql_%'
  AND NOT c.relrowsecurity
ORDER BY c.relname;

SELECT 'RLS Security Check Complete ✅' as final_status;
