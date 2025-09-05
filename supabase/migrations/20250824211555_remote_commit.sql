drop extension if exists "pg_net";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='preschool_onboarding_requests' AND policyname='allow_anonymous_onboarding_requests'
  ) THEN
    EXECUTE 'DROP POLICY "allow_anonymous_onboarding_requests" ON public.preschool_onboarding_requests';
  END IF;
END $$;

alter table "public"."preschools" drop constraint if exists "preschools_onboarding_status_check";

alter table "public"."preschools" drop constraint if exists "preschools_subscription_plan_check";

alter table "public"."preschools" drop constraint if exists "preschools_subscription_status_check";

alter table "public"."school_invitation_codes" drop constraint if exists "school_invitation_codes_invitation_type_check";

alter table "public"."preschools" add constraint "preschools_onboarding_status_check" CHECK (((onboarding_status)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'setup'::character varying, 'completed'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_onboarding_status_check";

alter table "public"."preschools" add constraint "preschools_subscription_plan_check" CHECK (((subscription_plan)::text = ANY ((ARRAY['trial'::character varying, 'basic'::character varying, 'premium'::character varying, 'enterprise'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_subscription_plan_check";

alter table "public"."preschools" add constraint "preschools_subscription_status_check" CHECK (((subscription_status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_subscription_status_check";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_invitation_type_check" CHECK (((invitation_type)::text = ANY ((ARRAY['principal'::character varying, 'teacher'::character varying, 'parent'::character varying])::text[]))) not valid;

alter table "public"."school_invitation_codes" validate constraint "school_invitation_codes_invitation_type_check";


DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='preschool_onboarding_requests'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_anonymous_onboarding_requests" ON public.preschool_onboarding_requests AS permissive FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;



