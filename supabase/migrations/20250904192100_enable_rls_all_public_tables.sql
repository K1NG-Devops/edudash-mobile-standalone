-- 2025-09-04: Enable RLS on all public tables that are currently unrestricted
-- Idempotent and safe: does not alter existing policies; only enables RLS where disabled.

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT quote_ident(n.nspname) AS schemaname,
           quote_ident(c.relname) AS relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r'
      AND n.nspname = 'public'
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE %s.%s ENABLE ROW LEVEL SECURITY;', r.schemaname, r.relname);
    RAISE NOTICE 'Enabled RLS on %.%', r.schemaname, r.relname;
  END LOOP;
END $$;

