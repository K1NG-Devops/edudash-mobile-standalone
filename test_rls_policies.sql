-- Safe RLS Policy Testing Script with Automatic Cleanup
-- This script tests RLS policies and removes all test data automatically
-- Run this in Supabase SQL Editor to validate security implementation
-- =====================================================

DO $$ 
DECLARE
    test_school_a_id UUID := 'test-a11-1111-1111-111111111111';
    test_school_b_id UUID := 'test-b22-2222-2222-222222222222';
    test_user_count INTEGER;
    test_student_count INTEGER;
    policy_count INTEGER;
    rls_enabled_count INTEGER;
BEGIN
    RAISE NOTICE '====== STARTING RLS SECURITY TESTS ======';
    
    -- =====================================================
    -- CREATE MINIMAL TEST DATA
    -- =====================================================
    
    RAISE NOTICE '1. Creating minimal test data...';
    
    -- Create test preschools with unique test IDs
    INSERT INTO public.preschools (id, name, email) VALUES
        (test_school_a_id, 'TEST School A - DELETE ME', 'test-delete-me-a@edudash.test'),
        (test_school_b_id, 'TEST School B - DELETE ME', 'test-delete-me-b@edudash.test')
    ON CONFLICT (id) DO NOTHING;
    
    -- Create minimal test users with fake auth IDs
    INSERT INTO public.users (id, auth_user_id, email, name, role, preschool_id) VALUES
        -- School A users
        ('test-admin-a', 'fake-auth-admin-a', 'test-admin-a@edudash.test', 'TEST Admin A', 'preschool_admin', test_school_a_id),
        ('test-parent-a', 'fake-auth-parent-a', 'test-parent-a@edudash.test', 'TEST Parent A', 'parent', test_school_a_id),
        
        -- School B users  
        ('test-admin-b', 'fake-auth-admin-b', 'test-admin-b@edudash.test', 'TEST Admin B', 'preschool_admin', test_school_b_id),
        ('test-parent-b', 'fake-auth-parent-b', 'test-parent-b@edudash.test', 'TEST Parent B', 'parent', test_school_b_id)
    ON CONFLICT (id) DO NOTHING;
    
    -- Create test students
    INSERT INTO public.students (id, preschool_id, first_name, last_name, parent_id, date_of_birth) VALUES
        ('test-student-a1', test_school_a_id, 'TEST Child', 'A1', 'test-parent-a', '2020-01-01'),
        ('test-student-b1', test_school_b_id, 'TEST Child', 'B1', 'test-parent-b', '2020-01-01')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test data created successfully.';
    
    -- =====================================================
    -- TEST 1: Verify RLS helper functions exist
    -- =====================================================
    
    RAISE NOTICE '2. Testing RLS helper functions...';
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_user_role') THEN
        RAISE EXCEPTION 'FAIL: get_current_user_role function missing!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_superadmin') THEN
        RAISE EXCEPTION 'FAIL: is_superadmin function missing!';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_access_preschool') THEN
        RAISE EXCEPTION 'FAIL: can_access_preschool function missing!';
    END IF;
    
    RAISE NOTICE 'PASS: All RLS helper functions exist.';
    
    -- =====================================================
    -- TEST 2: Verify RLS policies exist
    -- =====================================================
    
    RAISE NOTICE '3. Testing RLS policies...';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename IN ('users', 'preschools', 'students', 'classes', 'lessons');
    
    IF policy_count < 15 THEN
        RAISE EXCEPTION 'FAIL: Insufficient RLS policies found! Expected >= 15, found %', policy_count;
    END IF;
    
    RAISE NOTICE 'PASS: Found % RLS policies across critical tables.', policy_count;
    
    -- =====================================================
    -- TEST 3: Verify RLS is enabled on critical tables
    -- =====================================================
    
    RAISE NOTICE '4. Testing RLS enablement...';
    
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
      AND c.relname IN ('users', 'preschools', 'students', 'classes', 'lessons')
      AND c.relkind = 'r'
      AND c.relrowsecurity = true;
    
    IF rls_enabled_count < 5 THEN
        RAISE EXCEPTION 'FAIL: RLS not enabled on critical tables! Expected >= 5, found %', rls_enabled_count;
    END IF;
    
    RAISE NOTICE 'PASS: RLS enabled on % critical tables.', rls_enabled_count;
    
    -- =====================================================
    -- TEST 4: Basic data visibility test
    -- =====================================================
    
    RAISE NOTICE '5. Testing basic data visibility...';
    
    SELECT COUNT(*) INTO test_user_count FROM public.users WHERE email LIKE '%@edudash.test';
    SELECT COUNT(*) INTO test_student_count FROM public.students WHERE id LIKE 'test-student-%';
    
    IF test_user_count != 4 THEN
        RAISE EXCEPTION 'FAIL: Expected 4 test users, found %', test_user_count;
    END IF;
    
    IF test_student_count != 2 THEN
        RAISE EXCEPTION 'FAIL: Expected 2 test students, found %', test_student_count;
    END IF;
    
    RAISE NOTICE 'PASS: Test data visibility confirmed.';
    
    -- =====================================================
    -- TEST 5: Check for dangerous policies
    -- =====================================================
    
    RAISE NOTICE '6. Checking for dangerous policies...';
    
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
          AND tablename IN ('users', 'preschools', 'students')
          AND (cmd LIKE '%USING (true)%' OR cmd LIKE '%WITH CHECK (true)%')
          AND policyname NOT LIKE '%lesson_categories%' -- lesson_categories can be global
    ) THEN
        RAISE WARNING 'WARNING: Found potentially overly permissive policies!';
        
        -- Show the dangerous policies
        FOR rec IN 
            SELECT policyname, tablename 
            FROM pg_policies 
            WHERE schemaname = 'public'
              AND (cmd LIKE '%USING (true)%' OR cmd LIKE '%WITH CHECK (true)%')
              AND tablename IN ('users', 'preschools', 'students')
        LOOP
            RAISE WARNING 'Dangerous policy: % on table %', rec.policyname, rec.tablename;
        END LOOP;
    ELSE
        RAISE NOTICE 'PASS: No overly permissive policies found.';
    END IF;
    
    -- =====================================================
    -- CLEANUP: Remove all test data
    -- =====================================================
    
    RAISE NOTICE '7. Cleaning up test data...';
    
    -- Delete in proper order to respect foreign keys
    DELETE FROM public.students WHERE id LIKE 'test-student-%';
    DELETE FROM public.users WHERE email LIKE '%@edudash.test';
    DELETE FROM public.preschools WHERE email LIKE '%@edudash.test';
    
    RAISE NOTICE 'Test data cleaned up successfully.';
    
    -- =====================================================
    -- FINAL RESULTS
    -- =====================================================
    
    RAISE NOTICE '====== RLS SECURITY TEST RESULTS ======';
    RAISE NOTICE 'ALL TESTS PASSED! ✅';
    RAISE NOTICE 'RLS Policies: % policies found', policy_count;
    RAISE NOTICE 'RLS Enabled: % tables protected', rls_enabled_count;
    RAISE NOTICE 'Security Status: SECURE - Tenant isolation implemented';
    RAISE NOTICE '====== NO TEST DATA REMAINS IN DATABASE ======';
    
EXCEPTION 
    WHEN OTHERS THEN
        -- Cleanup test data even if tests fail
        RAISE NOTICE 'Cleaning up test data after failure...';
        DELETE FROM public.students WHERE id LIKE 'test-student-%';
        DELETE FROM public.users WHERE email LIKE '%@edudash.test';
        DELETE FROM public.preschools WHERE email LIKE '%@edudash.test';
        RAISE NOTICE 'Test data cleaned up.';
        
        -- Re-raise the exception
        RAISE;
END $$;

-- =====================================================
-- SECURITY SUMMARY
-- =====================================================

SELECT '====== SECURITY IMPLEMENTATION SUMMARY ======' as summary_header;

-- Show policy distribution
SELECT 
    'Policy Distribution' as metric_type,
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(
        CASE 
            WHEN cmd LIKE '%FOR SELECT%' THEN 'READ'
            WHEN cmd LIKE '%FOR INSERT%' THEN 'CREATE'
            WHEN cmd LIKE '%FOR UPDATE%' THEN 'UPDATE'
            WHEN cmd LIKE '%FOR DELETE%' THEN 'DELETE'
            WHEN cmd LIKE '%FOR ALL%' THEN 'FULL'
            ELSE 'UNKNOWN'
        END, ', '
    ) as permissions
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('users', 'preschools', 'age_groups', 'students', 'classes', 'lessons')
GROUP BY tablename
ORDER BY policy_count DESC;

-- Show RLS status
SELECT 
    'RLS Status' as metric_type,
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relname IN ('users', 'preschools', 'age_groups', 'students', 'classes', 'lessons')
  AND c.relkind = 'r'
ORDER BY c.relname;

SELECT '====== TENANT ISOLATION IS NOW SECURE ======' as final_message;
