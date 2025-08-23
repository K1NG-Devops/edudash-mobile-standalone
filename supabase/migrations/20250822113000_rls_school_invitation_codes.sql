-- RLS policies for school_invitation_codes to let principals manage their own school's codes
-- Safe for production: uses helper function is_preschool_admin(user_auth_id, target_preschool_id)

-- Ensure table exists and RLS is enabled (no-op if already set)
ALTER TABLE IF EXISTS public.school_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates (idempotent)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'school_invitation_codes' AND policyname = 'teachers_and_parents_can_read_active_codes'
  ) THEN
    EXECUTE 'DROP POLICY "teachers_and_parents_can_read_active_codes" ON public.school_invitation_codes';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'school_invitation_codes' AND policyname = 'principals_manage_own_school_codes'
  ) THEN
    EXECUTE 'DROP POLICY "principals_manage_own_school_codes" ON public.school_invitation_codes';
  END IF;
END $$;

-- Read policy: any authenticated user in the same school can read active, unexpired codes
CREATE POLICY teachers_and_parents_can_read_active_codes
ON public.school_invitation_codes
FOR SELECT
TO authenticated
USING (
  -- same school
  preschool_id = (
    SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid()
  )
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

-- Manage policy: principals/preschool_admins can insert/update their own school's codes
CREATE POLICY principals_manage_own_school_codes
ON public.school_invitation_codes
FOR ALL
TO authenticated
USING (
  (
    preschool_id = (
      SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.users pu 
        WHERE pu.auth_user_id = auth.uid() 
          AND pu.preschool_id = public.school_invitation_codes.preschool_id
          AND pu.role IN ('principal','preschool_admin','admin','superadmin')
      )
    )
  )
)
WITH CHECK (
  (
    preschool_id = (
      SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid()
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.users pu 
        WHERE pu.auth_user_id = auth.uid() 
          AND pu.preschool_id = public.school_invitation_codes.preschool_id
          AND pu.role IN ('principal','preschool_admin','admin','superadmin')
      )
    )
  )
);

-- Grant minimal privileges (RLS gates access)
GRANT SELECT, INSERT, UPDATE ON public.school_invitation_codes TO authenticated;


