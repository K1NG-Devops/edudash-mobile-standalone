-- 2025-08-27: Reinstate non-JWT users SELECT policies to allow principals to view users in their preschool
-- Safe/idempotent: Drops if-exists and recreates policies. Keeps existing JWT-based policy intact (OR semantics).
-- Rationale: Some environments lack role/preschool_id claims in JWT, blocking principal reads. This policy
-- uses a self-row read (auth.uid() = auth_user_id) plus a same-school principal check via subselect.

begin;

-- Ensure RLS is enabled (no-op if already enabled)
alter table if exists public.users enable row level security;

-- 1) Allow each authenticated user to view their own row
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_self'
  ) THEN
    EXECUTE 'DROP POLICY users_select_self ON public.users';
  END IF;
END $$;

CREATE POLICY users_select_self
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- 2) Allow principals/admins to view users in the same preschool via DB lookup (avoids relying on JWT claims)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_select_same_preschool_principals'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_principals ON public.users';
  END IF;
END $$;

CREATE POLICY users_select_same_preschool_principals
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
       WHERE u.auth_user_id = auth.uid()
         AND u.preschool_id = public.users.preschool_id
         AND u.role IN ('principal','preschool_admin','admin','superadmin')
         AND coalesce(u.is_active, true) = true
    )
  );

commit;
