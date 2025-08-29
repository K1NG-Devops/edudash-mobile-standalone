-- 2025-08-27: Replace recursive users RLS policy with SECURITY DEFINER helper to avoid infinite recursion
-- Safe/idempotent: drops prior policy and recreates using a function that evaluates principal access without
-- triggering RLS recursion. Keeps users_select_self policy intact.

begin;

-- Helper function evaluated in policies without causing recursion
create or replace function public.can_principal_view_user(target_preschool_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  -- Allow when the current auth.uid() belongs to a principal-like role in the same preschool
  return exists (
    select 1 from public.users u
     where u.auth_user_id = auth.uid()
       and u.preschool_id = target_preschool_id
       and u.role in ('principal','preschool_admin','admin','superadmin')
       and coalesce(u.is_active, true) = true
  );
end;
$$;

-- Ensure the function is callable by authenticated (no data leakage; returns boolean only)
revoke all on function public.can_principal_view_user(uuid) from public;
grant execute on function public.can_principal_view_user(uuid) to authenticated;

-- Drop the recursive inline policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'users'
       AND policyname = 'users_select_same_preschool_principals'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_principals ON public.users';
  END IF;
END $$;

-- Create function-based policy that avoids recursion
CREATE POLICY users_select_same_preschool_principals_fn
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    public.can_principal_view_user(public.users.preschool_id)
  );

commit;
