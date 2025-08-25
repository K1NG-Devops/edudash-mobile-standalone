drop extension if exists "pg_net";

drop policy "allow_anonymous_onboarding_requests" on "public"."preschool_onboarding_requests";

alter table "public"."preschools" drop constraint "preschools_onboarding_status_check";

alter table "public"."preschools" drop constraint "preschools_subscription_plan_check";

alter table "public"."preschools" drop constraint "preschools_subscription_status_check";

alter table "public"."school_invitation_codes" drop constraint "school_invitation_codes_invitation_type_check";

alter table "public"."preschools" add constraint "preschools_onboarding_status_check" CHECK (((onboarding_status)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'setup'::character varying, 'completed'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_onboarding_status_check";

alter table "public"."preschools" add constraint "preschools_subscription_plan_check" CHECK (((subscription_plan)::text = ANY ((ARRAY['trial'::character varying, 'basic'::character varying, 'premium'::character varying, 'enterprise'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_subscription_plan_check";

alter table "public"."preschools" add constraint "preschools_subscription_status_check" CHECK (((subscription_status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_subscription_status_check";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_invitation_type_check" CHECK (((invitation_type)::text = ANY ((ARRAY['principal'::character varying, 'teacher'::character varying, 'parent'::character varying])::text[]))) not valid;

alter table "public"."school_invitation_codes" validate constraint "school_invitation_codes_invitation_type_check";


  create policy "allow_anonymous_onboarding_requests"
  on "public"."preschool_onboarding_requests"
  as permissive
  for insert
  to anon, authenticated
with check (true);



