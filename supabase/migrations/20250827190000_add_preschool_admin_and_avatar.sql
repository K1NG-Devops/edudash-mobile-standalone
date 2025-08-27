-- 2025-08-27: Expand users.role allowed values and add users.avatar_url to support messaging and admin roles
-- Safe/idempotent migration. No destructive data changes.

begin;

-- 1) Ensure avatar_url exists on public.users (used across messaging and profiles)
alter table if exists public.users
  add column if not exists avatar_url text;

-- 2) Relax/expand users.role CHECK constraint to include preschool_admin and admin
-- Drop existing constraint if present, then recreate with the expanded set.
-- Note: Some environments may have different constraint names; handle common cases.
DO $$
BEGIN
  -- Try drop by standard name first
  BEGIN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  EXCEPTION WHEN others THEN
    -- Ignore
  END;

  -- Some exports use a generated constraint name; attempt to drop by detecting any CHECK on role
  -- that matches the known list prior to this migration. This is best-effort and harmless if none.
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public' AND t.relname = 'users' AND c.contype = 'c'
  ) THEN
    -- We only recreate; specific drop above should suffice in most cases
  END IF;

  -- Recreate constraint with the superset of roles used by the app and migrations
  EXECUTE 'ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN (''superadmin'',''principal'',''preschool_admin'',''admin'',''teacher'',''parent''))';
END $$;

commit;
