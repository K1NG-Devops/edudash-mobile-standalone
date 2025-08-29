-- 2025-08-28: Hotfix login breakage due to recursive users RLS policy
-- Goal: Remove recursive principal policy and ensure minimal self-access policies exist.

begin;

-- Keep RLS on
alter table if exists public.users enable row level security;

-- Drop the function-based recursive policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_same_preschool_principals_fn'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_principals_fn ON public.users';
  END IF;
END $$;

-- Drop any legacy principal policy that may still exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_same_preschool_principals'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_principals ON public.users';
  END IF;
END $$;

-- Optionally drop the helper function (not required elsewhere)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'can_principal_view_user' AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE 'DROP FUNCTION public.can_principal_view_user(uuid)';
  END IF;
END $$;

-- Ensure minimal self-select policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
     WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_self'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY users_select_self
        ON public.users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = auth_user_id)
    $POL$;
  END IF;
END $$;

-- Ensure minimal self-update policy exists (profile edits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
     WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_update_self'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY users_update_self
        ON public.users
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = auth_user_id)
        WITH CHECK (auth.uid() = auth_user_id)
    $POL$;
  END IF;
END $$;

commit;

