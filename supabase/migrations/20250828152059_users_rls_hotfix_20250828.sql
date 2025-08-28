-- EduDash Pro — Users RLS Hotfix (idempotent, non-recursive)
-- Purpose: eliminate infinite recursion in users RLS by removing recursive policies
-- and establishing minimal self-access plus a JWT-claims-based same-school read policy.
-- Safe to re-run.

begin;

-- Ensure RLS is enabled
alter table if exists public.users enable row level security;

-- Drop known recursive/legacy policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_same_preschool_principals_fn'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_principals_fn ON public.users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_same_preschool_principals'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_principals ON public.users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'Users can view their own profile'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own profile" ON public.users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'Principals can view users in their preschool'
  ) THEN
    EXECUTE 'DROP POLICY "Principals can view users in their preschool" ON public.users';
  END IF;
END $$;

-- Ensure fresh (idempotent) creation by dropping if exists, then creating policies
DROP POLICY IF EXISTS users_select_self ON public.users;
CREATE POLICY users_select_self
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS users_update_self ON public.users;
CREATE POLICY users_update_self
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- JWT-claims-based same-school SELECT policy (avoids querying users inside users policies)
DROP POLICY IF EXISTS users_select_self_or_same_school_via_jwt ON public.users;
CREATE POLICY users_select_self_or_same_school_via_jwt
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = auth_user_id
    OR (
      COALESCE(
        NULLIF(auth.jwt() ->> 'role', ''),
        NULLIF((auth.jwt() -> 'user_metadata' ->> 'role'), '')
      ) IN ('principal','preschool_admin','admin','superadmin')
      AND preschool_id IS NOT NULL
      AND preschool_id = NULLIF(
        COALESCE(
          NULLIF(auth.jwt() ->> 'preschool_id', ''),
          NULLIF((auth.jwt() -> 'user_metadata' ->> 'preschool_id'), '')
        ),
        ''
      )::uuid
    )
  );

commit;
