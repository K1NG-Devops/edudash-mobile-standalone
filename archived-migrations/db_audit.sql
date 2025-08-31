-- DB AUDIT SCRIPT (Supabase / Postgres)
-- Run in Supabase SQL editor. It prints structure, RLS, policies, indexes, FKs, functions, triggers, extensions, and row counts.

-- 0) Context
SELECT current_database()                       AS db,
       current_schema()                          AS schema,
       current_user                              AS db_user,
       (SELECT setting FROM pg_settings WHERE name = 'server_version') AS pg_version;

-- 1) Tables in public + RLS status and policy count
SELECT n.nspname     AS schema,
       c.relname     AS table_name,
       c.relrowsecurity AS rls_enabled,
       c.relforcerowsecurity AS rls_forced,
       COALESCE(p.policy_count, 0) AS policy_count,
       pg_total_relation_size(c.oid) AS total_bytes
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
  SELECT pol.polrelid, COUNT(*) AS policy_count
  FROM pg_policies pol
  GROUP BY pol.polrelid
) p ON p.polrelid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

-- 2) Columns per table
SELECT table_schema, table_name, ordinal_position, column_name, data_type,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3) Indexes
SELECT schemaname AS schema,
       tablename  AS table_name,
       indexname,
       indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4) Foreign Keys
SELECT tc.table_schema, tc.table_name, tc.constraint_name,
       kcu.column_name,
       ccu.table_schema AS foreign_table_schema,
       ccu.table_name   AS foreign_table_name,
       ccu.column_name  AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 5) Policies (detail)
SELECT pol.schemaname,
       pol.tablename,
       pol.policyname,
       pol.cmd,
       pol.roles,
       pol.qual,
       pol.with_check
FROM pg_policies pol
WHERE pol.schemaname = 'public'
ORDER BY pol.tablename, pol.policyname;

-- 6) Triggers
SELECT event_object_schema AS schema,
       event_object_table  AS table_name,
       trigger_name,
       action_timing,
       event_manipulation AS event,
       action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 7) Functions in public (RPC candidates)
SELECT n.nspname AS schema,
       p.proname AS function_name,
       pg_get_function_result(p.oid) AS returns,
       pg_get_function_arguments(p.oid) AS args,
       l.lanname AS lang,
       p.prosecdef AS security_definer,
       p.provolatile AS volatility
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
ORDER BY p.proname;

-- 8) Extensions
SELECT extname, extversion FROM pg_extension ORDER BY extname;

-- 9) Row counts for key tables (if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname='users' AND c.relkind='r') THEN
    RAISE NOTICE 'users: %', (SELECT COUNT(*) FROM public.users);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname='preschools' AND c.relkind='r') THEN
    RAISE NOTICE 'preschools: %', (SELECT COUNT(*) FROM public.preschools);
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relname='messages' AND c.relkind='r') THEN
    RAISE NOTICE 'messages: %', (SELECT COUNT(*) FROM public.messages);
  END IF;
END$$;

-- 10) Permissions (optional overview)
SELECT table_schema, table_name, privilege_type, grantee
FROM information_schema.role_table_grants
WHERE table_schema='public'
ORDER BY table_name, grantee, privilege_type;
