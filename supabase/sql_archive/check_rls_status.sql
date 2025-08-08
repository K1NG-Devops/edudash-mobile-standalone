-- Check RLS status on all important tables
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED ✅'
    ELSE 'RLS DISABLED ❌'
  END as rls_status,
  (
    SELECT count(*) 
    FROM pg_policies 
    WHERE schemaname = t.schemaname 
    AND tablename = t.tablename
  ) as policy_count
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE schemaname = 'public'
  AND tablename IN (
    'users', 'preschools', 'students', 'classes', 'payments', 
    'payment_fees', 'payment_receipts', 'lessons', 'activities',
    'homework_assignments', 'homework_submissions'
  )
ORDER BY tablename;

-- Also show which tables exist in your database
SELECT 'Tables that exist in your database:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
