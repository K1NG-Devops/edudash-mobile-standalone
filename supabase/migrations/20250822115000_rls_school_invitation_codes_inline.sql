-- RLS policies for school_invitation_codes without depending on helper functions

ALTER TABLE IF EXISTS public.school_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Remove previous policies if present
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
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'school_invitation_codes' AND policyname = 'principals_manage_own_school_codes_inline'
  ) THEN
    EXECUTE 'DROP POLICY "principals_manage_own_school_codes_inline" ON public.school_invitation_codes';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'school_invitation_codes' AND policyname = 'same_school_read_active_codes_inline'
  ) THEN
    EXECUTE 'DROP POLICY "same_school_read_active_codes_inline" ON public.school_invitation_codes';
  END IF;
END $$;

-- Inline role + tenant check helper expression
-- A user can manage codes if they belong to the same preschool and have a principal-like role
-- principal roles considered: principal, preschool_admin, admin, superadmin

CREATE POLICY same_school_read_active_codes_inline
ON public.school_invitation_codes
FOR SELECT
TO authenticated
USING (
  (
    preschool_id = (
      SELECT u.preschool_id FROM public.users u WHERE u.auth_user_id = auth.uid()
    )
    OR (
      -- allow superadmins to read across schools
      EXISTS (
        SELECT 1 FROM public.users su WHERE su.auth_user_id = auth.uid() AND su.role = 'superadmin'
      )
    )
  )
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now())
);

CREATE POLICY principals_manage_own_school_codes_inline
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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_invitation_codes TO authenticated;


