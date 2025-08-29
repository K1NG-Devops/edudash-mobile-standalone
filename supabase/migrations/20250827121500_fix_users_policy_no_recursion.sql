-- 2025-08-27: Fix users SELECT policy to avoid infinite recursion by using JWT claims
-- Safe, idempotent: only affects SELECT policies. No destructive changes.

begin;

-- Drop old recursive or legacy policies if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'Principals can view users in their preschool'
  ) THEN
    EXECUTE 'DROP POLICY "Principals can view users in their preschool" ON public.users';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'Users can view their own profile'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view their own profile" ON public.users';
  END IF;
END $$;

-- Create a single SELECT policy based on JWT claims to avoid self-reference recursion
-- Allows:
--  - Every user to read their own row (auth.uid() = auth_user_id)
--  - Principals/Admins to read users in the same preschool if JWT contains role & preschool_id
CREATE POLICY users_select_self_or_same_school_via_jwt
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.uid() = auth_user_id
  OR (
    -- Determine role from top-level claim or user_metadata
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
