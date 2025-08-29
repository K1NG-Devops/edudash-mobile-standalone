-- 2025-08-28: Fix conversation_members RLS recursion via SECURITY DEFINER helper
-- Adds public.is_conversation_admin(auth_user_id uuid, conversation_id uuid)
-- Replaces the conv_members_select_self policy to avoid self-referencing table recursion

BEGIN;

-- Helper that checks if the given auth user is an owner/admin of a conversation.
-- SECURITY DEFINER + owned by table owner = bypasses RLS (since we only ENABLE RLS, not FORCE)
CREATE OR REPLACE FUNCTION public.is_conversation_admin(p_auth_user_id uuid, p_conversation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_is_admin boolean := false;
BEGIN
  -- If either param is null, fail closed
  IF p_auth_user_id IS NULL OR p_conversation_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check membership role using users -> conversation_members without triggering recursion
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    JOIN public.users u ON u.id = cm.user_id
    WHERE u.auth_user_id = p_auth_user_id
      AND cm.conversation_id = p_conversation_id
      AND cm.role IN ('owner','admin')
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Allow authenticated role to execute the helper in RLS context
GRANT EXECUTE ON FUNCTION public.is_conversation_admin(uuid, uuid) TO authenticated;

-- Replace the existing select policy with a version that uses the helper function, avoiding recursive self-joins
DROP POLICY IF EXISTS conv_members_select_self_v2 ON public.conversation_members;
CREATE POLICY conv_members_select_self_v3
  ON public.conversation_members
  FOR SELECT
  TO authenticated
  USING (
    -- Self can view their own row
    (SELECT u.auth_user_id FROM public.users u WHERE u.id = public.conversation_members.user_id) = auth.uid()
    OR
    -- Owners/Admins of the conversation can view membership rows
    public.is_conversation_admin(auth.uid(), public.conversation_members.conversation_id)
  );

COMMIT;

