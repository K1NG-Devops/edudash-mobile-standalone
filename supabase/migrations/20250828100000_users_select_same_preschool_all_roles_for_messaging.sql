-- 2025-08-28: Allow authenticated users to SELECT basic user rows within the same preschool (for messaging contacts)
-- Safe/idempotent: Adds a SELECT policy that ORs with existing policies. Does not grant INSERT/UPDATE/DELETE.

begin;

-- Ensure RLS is enabled
alter table if exists public.users enable row level security;

-- Create a SELECT policy permitting users to read other users in the same preschool
-- This is needed so parents/teachers can list messaging contacts.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_same_preschool_all_roles_for_messaging'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY users_select_same_preschool_all_roles_for_messaging
        ON public.users
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users u
             WHERE u.auth_user_id = auth.uid()
               AND u.preschool_id IS NOT NULL
               AND u.preschool_id = public.users.preschool_id
          )
        )
    $POL$;
  END IF;
END $$;

commit;

