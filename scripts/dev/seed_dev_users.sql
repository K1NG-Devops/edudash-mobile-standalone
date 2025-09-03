-- DEV-ONLY SEED SCRIPT
-- Purpose: Create a minimal dataset in the DEV database for testing login and basic flows.
-- IMPORTANT: Do NOT run this in production.
-- Idempotent: safe to run multiple times.

DO $$
DECLARE
  v_school uuid;
BEGIN
  -- 1) Ensure a dev preschool exists
  SELECT id INTO v_school FROM public.preschools WHERE tenant_slug = 'dev-pre-1' LIMIT 1;

  IF v_school IS NULL THEN
    -- Create a school. Function returns JSONB with school_id
    WITH s AS (
      SELECT (public.create_school_with_admin(
        p_school_name => 'Dev Preschool',
        p_admin_email => 'principal+dev@edudashpro.test',
        p_admin_name  => 'Dev Principal',
        p_subscription_plan => 'trial'
      )->>'school_id')::uuid AS school_id
    )
    SELECT school_id INTO v_school FROM s;

    -- Set a stable tenant_slug to make future runs idempotent
    UPDATE public.preschools
    SET tenant_slug = 'dev-pre-1'
    WHERE id = v_school AND tenant_slug IS NULL;
  END IF;

  -- 2) Create DEV auth users (principal, teacher, parent)
  -- Note: The trigger on auth.users (public.handle_auth_user_created) will auto-create/link public.users rows

  -- Principal
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'principal+dev@edudashpro.test') THEN
    INSERT INTO auth.users (
      id, instance_id, email, raw_user_meta_data, encrypted_password,
      email_confirmed_at, created_at, updated_at, role, aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'principal+dev@edudashpro.test',
      jsonb_build_object('role','principal','preschool_id', v_school::text, 'name','Dev Principal'),
      crypt('DevTemp#123', gen_salt('bf')),
      now(), now(), now(),
      'authenticated','authenticated'
    );
  END IF;

  -- Teacher
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'teacher+dev@edudashpro.test') THEN
    INSERT INTO auth.users (
      id, instance_id, email, raw_user_meta_data, encrypted_password,
      email_confirmed_at, created_at, updated_at, role, aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'teacher+dev@edudashpro.test',
      jsonb_build_object('role','teacher','preschool_id', v_school::text, 'name','Dev Teacher'),
      crypt('DevTemp#123', gen_salt('bf')),
      now(), now(), now(),
      'authenticated','authenticated'
    );
  END IF;

  -- Parent
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'parent+dev@edudashpro.test') THEN
    INSERT INTO auth.users (
      id, instance_id, email, raw_user_meta_data, encrypted_password,
      email_confirmed_at, created_at, updated_at, role, aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'parent+dev@edudashpro.test',
      jsonb_build_object('role','parent','preschool_id', v_school::text, 'name','Dev Parent'),
      crypt('DevTemp#123', gen_salt('bf')),
      now(), now(), now(),
      'authenticated','authenticated'
    );
  END IF;

END $$;

