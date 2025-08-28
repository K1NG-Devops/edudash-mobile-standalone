-- 2025-08-28: Replace broad users SELECT policy with a scoped SECURITY DEFINER RPC for messaging contacts
-- This migration:
--  - Drops the broad users SELECT policy added previously for messaging
--  - Creates function public.get_messaging_contacts(...) returning minimal fields
--  - Grants EXECUTE to authenticated

begin;

-- Drop broad policy if present (use idempotent drop)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = 'users' AND p.policyname = 'users_select_same_preschool_all_roles_for_messaging'
  ) THEN
    EXECUTE 'DROP POLICY users_select_same_preschool_all_roles_for_messaging ON public.users';
  END IF;
END $$;

-- Create SECURITY DEFINER RPC to fetch messaging contacts scoped to the current auth user's preschool
-- Returns minimal fields used by the UI
create or replace function public.get_messaging_contacts(
  p_include_staff boolean default true,
  p_include_parents boolean default true,
  p_limit integer default 500
)
returns table (
  id uuid,
  name text,
  role text,
  avatar_url text,
  email text,
  class_name text
)
language plpgsql
security definer
set search_path = public
stable
as $$
DECLARE
  v_me RECORD;
BEGIN
  -- Resolve current user
  SELECT u.id, u.role, u.preschool_id
    INTO v_me
  FROM public.users u
  WHERE u.auth_user_id = auth.uid();

  IF v_me.id IS NULL OR v_me.preschool_id IS NULL THEN
    RETURN; -- no rows
  END IF;

  -- Staff contacts (teachers + admins) in the same preschool
  IF p_include_staff THEN
    RETURN QUERY
    SELECT u.id,
           COALESCE(u.name, 'Unknown') AS name,
           u.role,
           u.avatar_url,
           u.email,
           NULL::text AS class_name
    FROM public.users u
    WHERE u.preschool_id = v_me.preschool_id
      AND u.id <> v_me.id
      AND u.role IN ('teacher','principal','preschool_admin','admin')
      AND COALESCE(u.is_active, true) = true
    LIMIT p_limit;
  END IF;

  -- Parent contacts
  IF p_include_parents THEN
    IF v_me.role = 'parent' THEN
      -- For parents: only other parents who share a class with their child(ren)
      RETURN QUERY
      WITH my_classes AS (
        SELECT DISTINCT s.class_id
        FROM public.students s
        WHERE s.parent_id = v_me.id
      ),
      other_parents AS (
        SELECT DISTINCT s2.parent_id AS parent_id, c.name AS class_name
        FROM public.students s2
        JOIN my_classes mc ON mc.class_id = s2.class_id
        JOIN public.classes c ON c.id = s2.class_id
        WHERE s2.parent_id IS NOT NULL
          AND s2.parent_id <> v_me.id
      )
      SELECT u.id,
             COALESCE(u.name, 'Unknown Parent') AS name,
             'parent' AS role,
             u.avatar_url,
             u.email,
             op.class_name
      FROM other_parents op
      JOIN public.users u ON u.id = op.parent_id
      WHERE u.preschool_id = v_me.preschool_id
        AND COALESCE(u.is_active, true) = true
      LIMIT p_limit;
    ELSE
      -- For staff: all parents in the same preschool
      RETURN QUERY
      SELECT u.id,
             COALESCE(u.name, 'Unknown Parent') AS name,
             'parent' AS role,
             u.avatar_url,
             u.email,
             NULL::text AS class_name
      FROM public.users u
      WHERE u.preschool_id = v_me.preschool_id
        AND u.role = 'parent'
        AND COALESCE(u.is_active, true) = true
      LIMIT p_limit;
    END IF;
  END IF;

END;
$$;

-- Lock down and grant execute only to authenticated
revoke all on function public.get_messaging_contacts(boolean, boolean, integer) from public;
grant execute on function public.get_messaging_contacts(boolean, boolean, integer) to authenticated;

commit;

