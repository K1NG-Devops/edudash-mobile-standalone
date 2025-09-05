-- 2025-09-04: Allow authenticated superadmins to SELECT onboarding requests (dev-safe)

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'preschool_onboarding_requests'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'preschool_onboarding_requests'
        AND policyname = 'superadmin_select_onboarding_requests'
    ) THEN
      EXECUTE 'CREATE POLICY "superadmin_select_onboarding_requests" ON public.preschool_onboarding_requests
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid()
              AND u.role = ''superadmin''
              AND (u.is_active IS TRUE OR u.is_active IS NULL)
          )
        )';
    END IF;
  END IF;
END $$;

