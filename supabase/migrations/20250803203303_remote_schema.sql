drop policy "activities_policy" on "public"."activities";

drop policy "age_groups_policy" on "public"."age_groups";

drop policy "classes_policy" on "public"."classes";

drop policy "homework_assignments_policy" on "public"."homework_assignments";

drop policy "homework_submissions_policy" on "public"."homework_submissions";

drop policy "preschools_policy" on "public"."preschools";

drop policy "students_policy" on "public"."students";

drop policy "users_policy" on "public"."users";

revoke delete on table "public"."homework_assignments" from "anon";

revoke insert on table "public"."homework_assignments" from "anon";

revoke references on table "public"."homework_assignments" from "anon";

revoke select on table "public"."homework_assignments" from "anon";

revoke trigger on table "public"."homework_assignments" from "anon";

revoke truncate on table "public"."homework_assignments" from "anon";

revoke update on table "public"."homework_assignments" from "anon";

revoke delete on table "public"."homework_assignments" from "authenticated";

revoke insert on table "public"."homework_assignments" from "authenticated";

revoke references on table "public"."homework_assignments" from "authenticated";

revoke select on table "public"."homework_assignments" from "authenticated";

revoke trigger on table "public"."homework_assignments" from "authenticated";

revoke truncate on table "public"."homework_assignments" from "authenticated";

revoke update on table "public"."homework_assignments" from "authenticated";

revoke delete on table "public"."homework_assignments" from "service_role";

revoke insert on table "public"."homework_assignments" from "service_role";

revoke references on table "public"."homework_assignments" from "service_role";

revoke select on table "public"."homework_assignments" from "service_role";

revoke trigger on table "public"."homework_assignments" from "service_role";

revoke truncate on table "public"."homework_assignments" from "service_role";

revoke update on table "public"."homework_assignments" from "service_role";

revoke delete on table "public"."homework_submissions" from "anon";

revoke insert on table "public"."homework_submissions" from "anon";

revoke references on table "public"."homework_submissions" from "anon";

revoke select on table "public"."homework_submissions" from "anon";

revoke trigger on table "public"."homework_submissions" from "anon";

revoke truncate on table "public"."homework_submissions" from "anon";

revoke update on table "public"."homework_submissions" from "anon";

revoke delete on table "public"."homework_submissions" from "authenticated";

revoke insert on table "public"."homework_submissions" from "authenticated";

revoke references on table "public"."homework_submissions" from "authenticated";

revoke select on table "public"."homework_submissions" from "authenticated";

revoke trigger on table "public"."homework_submissions" from "authenticated";

revoke truncate on table "public"."homework_submissions" from "authenticated";

revoke update on table "public"."homework_submissions" from "authenticated";

revoke delete on table "public"."homework_submissions" from "service_role";

revoke insert on table "public"."homework_submissions" from "service_role";

revoke references on table "public"."homework_submissions" from "service_role";

revoke select on table "public"."homework_submissions" from "service_role";

revoke trigger on table "public"."homework_submissions" from "service_role";

revoke truncate on table "public"."homework_submissions" from "service_role";

revoke update on table "public"."homework_submissions" from "service_role";

alter table "public"."activities" drop constraint "fk_activities_class";

alter table "public"."activities" drop constraint "fk_activities_creator";

alter table "public"."activities" drop constraint "fk_activities_preschool";

alter table "public"."age_groups" drop constraint "fk_age_groups_preschool";

alter table "public"."classes" drop constraint "fk_classes_age_group";

alter table "public"."classes" drop constraint "fk_classes_preschool";

alter table "public"."classes" drop constraint "fk_classes_teacher";

alter table "public"."homework_assignments" drop constraint "fk_homework_class";

alter table "public"."homework_assignments" drop constraint "fk_homework_teacher";

alter table "public"."homework_submissions" drop constraint "fk_submissions_homework";

alter table "public"."homework_submissions" drop constraint "fk_submissions_parent";

alter table "public"."homework_submissions" drop constraint "fk_submissions_student";

alter table "public"."homework_submissions" drop constraint "homework_submissions_status_check";

alter table "public"."students" drop constraint "fk_students_age_group";

alter table "public"."students" drop constraint "fk_students_class";

alter table "public"."students" drop constraint "fk_students_parent";

alter table "public"."students" drop constraint "fk_students_preschool";

alter table "public"."users" drop constraint "fk_users_preschool";

alter table "public"."users" drop constraint "users_role_check";

alter table "public"."homework_assignments" drop constraint "homework_assignments_pkey";

alter table "public"."homework_submissions" drop constraint "homework_submissions_pkey";

drop index if exists "public"."homework_assignments_pkey";

drop index if exists "public"."homework_submissions_pkey";

drop table "public"."homework_assignments";

drop table "public"."homework_submissions";

create table "public"."addresses" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "address_type" character varying(20) default 'home'::character varying,
    "street_address" text not null,
    "city" character varying(100) not null,
    "province" character varying(50) not null,
    "postal_code" character varying(20),
    "country" character varying(50) default 'South Africa'::character varying,
    "is_primary" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."addresses" enable row level security;

create table "public"."class_assignments" (
    "id" uuid not null default gen_random_uuid(),
    "class_id" uuid not null,
    "teacher_id" uuid not null,
    "assigned_by" uuid not null,
    "assigned_at" timestamp with time zone default now(),
    "status" character varying(20) default 'active'::character varying,
    "academic_year" character varying(10),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."class_assignments" enable row level security;

create table "public"."emergency_contacts" (
    "id" uuid not null default uuid_generate_v4(),
    "student_id" uuid not null,
    "contact_name" character varying(255) not null,
    "contact_phone" character varying(20) not null,
    "relationship" character varying(100),
    "contact_email" character varying(255),
    "contact_address" text,
    "priority_order" integer default 1,
    "is_authorized_pickup" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."emergency_contacts" enable row level security;

create table "public"."invitation_uses" (
    "id" uuid not null default gen_random_uuid(),
    "invitation_code_id" uuid not null,
    "user_id" uuid,
    "parent_email" character varying(255),
    "child_name" character varying(255),
    "used_at" timestamp with time zone default now(),
    "status" character varying(20) default 'pending'::character varying,
    "approved_by" uuid,
    "approved_at" timestamp with time zone
);


alter table "public"."invitation_uses" enable row level security;

create table "public"."lesson_categories" (
    "id" uuid not null default uuid_generate_v4(),
    "name" character varying(100) not null,
    "description" text,
    "icon" character varying(50),
    "color" character varying(7),
    "color_theme" character varying(7),
    "icon_name" character varying(50)
);


alter table "public"."lesson_categories" enable row level security;

create table "public"."lessons" (
    "id" uuid not null default uuid_generate_v4(),
    "title" character varying(255) not null,
    "description" text,
    "content" text,
    "category_id" uuid not null,
    "age_group_id" uuid not null,
    "duration_minutes" integer default 30,
    "difficulty_level" integer default 1,
    "materials_needed" text,
    "learning_objectives" text,
    "is_public" boolean default false,
    "preschool_id" uuid,
    "created_by" uuid,
    "thumbnail_url" text,
    "video_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_published" boolean default false,
    "tier" character varying(20) default 'free'::character varying,
    "is_featured" boolean default false,
    "has_video" boolean default false,
    "has_interactive" boolean default false,
    "has_printables" boolean default false,
    "stem_concepts" text[],
    "home_extension" text[]
);


alter table "public"."lessons" enable row level security;

create table "public"."parent_access_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" character varying(10) not null,
    "preschool_id" uuid,
    "student_name" character varying(255) not null,
    "parent_email" character varying(255) not null,
    "created_by" uuid,
    "expires_at" timestamp with time zone not null,
    "status" character varying(20) default 'active'::character varying,
    "usage_count" integer default 0,
    "max_usage" integer default 1,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."parent_access_codes" enable row level security;

create table "public"."parent_details" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "primary_parent_name" character varying(255),
    "primary_parent_phone" character varying(20),
    "primary_parent_email" character varying(255),
    "primary_parent_workplace" character varying(255),
    "primary_parent_job_title" character varying(255),
    "secondary_parent_name" character varying(255),
    "secondary_parent_phone" character varying(20),
    "secondary_parent_email" character varying(255),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."parent_details" enable row level security;

create table "public"."premium_features" (
    "id" uuid not null default gen_random_uuid(),
    "name" character varying(100) not null,
    "description" text,
    "tier_required" character varying(20) not null,
    "feature_type" character varying(50) not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."premium_features" enable row level security;

create table "public"."preschool_onboarding_requests" (
    "id" uuid not null default uuid_generate_v4(),
    "preschool_name" character varying(255) not null,
    "admin_name" character varying(255) not null,
    "admin_email" character varying(255) not null,
    "phone" character varying(20),
    "address" text,
    "number_of_students" integer,
    "number_of_teachers" integer,
    "message" text,
    "status" character varying(20) default 'pending'::character varying,
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "preferred_slug" character varying(50),
    "school_type" character varying(50),
    "expected_students" integer,
    "notes" text,
    "city" character varying(100),
    "province" character varying(100),
    "postal_code" character varying(20),
    "contact_person_name" character varying(255),
    "email" character varying(255),
    "description" text,
    "expected_teachers" integer
);


alter table "public"."preschool_onboarding_requests" enable row level security;

create table "public"."school_invitation_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" character varying(10) not null,
    "preschool_id" uuid not null,
    "created_by" uuid not null,
    "expires_at" timestamp with time zone not null,
    "status" character varying(20) default 'active'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_active" boolean default true,
    "max_uses" integer,
    "description" text,
    "usage_count" integer default 0
);


alter table "public"."school_invitation_codes" enable row level security;

create table "public"."student_medical_info" (
    "id" uuid not null default uuid_generate_v4(),
    "student_id" uuid not null,
    "allergies" text,
    "medical_conditions" text,
    "current_medications" text,
    "doctor_name" character varying(255),
    "doctor_phone" character varying(20),
    "doctor_address" text,
    "medical_notes" text,
    "dietary_restrictions" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."student_medical_info" enable row level security;

create table "public"."student_registrations" (
    "id" uuid not null default gen_random_uuid(),
    "preschool_id" uuid not null,
    "student_id" uuid not null,
    "registered_by" uuid not null,
    "school_invitation_code_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."student_registrations" enable row level security;

create table "public"."teacher_class_schedules" (
    "id" uuid not null default gen_random_uuid(),
    "class_assignment_id" uuid not null,
    "lesson_id" uuid not null,
    "scheduled_date" date not null,
    "scheduled_time" time without time zone,
    "duration_minutes" integer default 30,
    "status" character varying(20) default 'scheduled'::character varying,
    "notes" text,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."teacher_class_schedules" enable row level security;

create table "public"."tenant_invitations" (
    "id" uuid not null default uuid_generate_v4(),
    "preschool_id" uuid not null,
    "email" character varying(255) not null,
    "role" character varying(20) not null,
    "invited_by" uuid not null,
    "invitation_token" character varying(255) not null,
    "status" character varying(20) default 'pending'::character varying,
    "expires_at" timestamp with time zone not null,
    "accepted_at" timestamp with time zone,
    "accepted_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."tenant_invitations" enable row level security;

create table "public"."tenant_onboarding_steps" (
    "id" uuid not null default uuid_generate_v4(),
    "preschool_id" uuid not null,
    "step_name" character varying(50) not null,
    "status" character varying(20) default 'pending'::character varying,
    "completed_at" timestamp with time zone,
    "completed_by" uuid,
    "data" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."tenant_onboarding_steps" enable row level security;

create table "public"."tenant_settings" (
    "id" uuid not null default uuid_generate_v4(),
    "preschool_id" uuid not null,
    "setting_key" character varying(100) not null,
    "setting_value" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."tenant_settings" enable row level security;

create table "public"."user_preferences" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "theme" character varying(10) default 'system'::character varying,
    "notifications_enabled" boolean default true,
    "email_digest" character varying(20) default 'weekly'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_preferences" enable row level security;

alter table "public"."activities" drop column "activity_date";

alter table "public"."activities" drop column "class_id";

alter table "public"."activities" drop column "created_at";

alter table "public"."activities" drop column "created_by";

alter table "public"."activities" drop column "end_time";

alter table "public"."activities" drop column "is_active";

alter table "public"."activities" drop column "location";

alter table "public"."activities" drop column "preschool_id";

alter table "public"."activities" drop column "start_time";

alter table "public"."activities" drop column "updated_at";

alter table "public"."activities" add column "activity_type" character varying(50) not null;

alter table "public"."activities" add column "estimated_time" integer;

alter table "public"."activities" add column "instructions" text;

alter table "public"."activities" add column "lesson_id" uuid not null;

alter table "public"."activities" add column "materials" text;

alter table "public"."activities" add column "sequence_order" integer default 1;

alter table "public"."activities" alter column "title" set data type character varying(255) using "title"::character varying(255);

alter table "public"."age_groups" drop column "updated_at";

alter table "public"."age_groups" add column "max_age_months" integer;

alter table "public"."age_groups" add column "min_age_months" integer;

alter table "public"."age_groups" alter column "id" set default gen_random_uuid();

alter table "public"."age_groups" alter column "max_age" set default 5;

alter table "public"."age_groups" alter column "min_age" set default 0;

alter table "public"."age_groups" alter column "name" set data type character varying(50) using "name"::character varying(50);

alter table "public"."age_groups" alter column "preschool_id" drop not null;

alter table "public"."classes" drop column "updated_at";

alter table "public"."classes" alter column "age_group_id" set not null;

alter table "public"."classes" alter column "max_capacity" set default 15;

alter table "public"."classes" alter column "max_capacity" drop not null;

alter table "public"."classes" alter column "name" set data type character varying(255) using "name"::character varying(255);

alter table "public"."classes" alter column "room_number" set data type character varying(50) using "room_number"::character varying(50);

alter table "public"."preschools" drop column "description";

alter table "public"."preschools" drop column "is_active";

alter table "public"."preschools" drop column "website";

alter table "public"."preschools" add column "billing_email" character varying(255);

alter table "public"."preschools" add column "current_invitation_code" character varying(20);

alter table "public"."preschools" add column "domain" character varying(100);

alter table "public"."preschools" add column "invitation_code_expires_at" timestamp with time zone;

alter table "public"."preschools" add column "max_students" integer default 50;

alter table "public"."preschools" add column "max_teachers" integer default 10;

alter table "public"."preschools" add column "onboarding_status" character varying(20) default 'requested'::character varying;

alter table "public"."preschools" add column "setup_completed" boolean default false;

alter table "public"."preschools" add column "subscription_end_date" date;

alter table "public"."preschools" add column "subscription_plan" character varying(20) default 'trial'::character varying;

alter table "public"."preschools" add column "subscription_start_date" date;

alter table "public"."preschools" add column "subscription_status" character varying(20) default 'pending'::character varying;

alter table "public"."preschools" add column "tenant_slug" character varying(50);

alter table "public"."preschools" add column "timezone" character varying(50) default 'UTC'::character varying;

alter table "public"."preschools" alter column "email" set not null;

alter table "public"."preschools" alter column "email" set data type character varying(255) using "email"::character varying(255);

alter table "public"."preschools" alter column "name" set data type character varying(255) using "name"::character varying(255);

alter table "public"."preschools" alter column "phone" set data type character varying(20) using "phone"::character varying(20);

alter table "public"."students" drop column "age";

alter table "public"."students" drop column "emergency_contact";

alter table "public"."students" drop column "medical_info";

alter table "public"."students" add column "emergency_contact_name" character varying(255);

alter table "public"."students" add column "previous_school_experience" text;

alter table "public"."students" alter column "age_group_id" set not null;

alter table "public"."students" alter column "consent_field_trips" set default false;

alter table "public"."students" alter column "consent_media" set default false;

alter table "public"."students" alter column "consent_photography" set default false;

alter table "public"."students" alter column "consent_policies" set default false;

alter table "public"."students" alter column "document_uploads" set default '[]'::jsonb;

alter table "public"."students" alter column "emergency_contact_phone" set data type character varying(20) using "emergency_contact_phone"::character varying(20);

alter table "public"."students" alter column "emergency_contact_relation" set data type character varying(100) using "emergency_contact_relation"::character varying(100);

alter table "public"."students" alter column "enrollment_date" set default CURRENT_DATE;

alter table "public"."students" alter column "enrollment_date" set data type date using "enrollment_date"::date;

alter table "public"."students" alter column "first_name" set data type character varying(255) using "first_name"::character varying(255);

alter table "public"."students" alter column "gender" set data type character varying(20) using "gender"::character varying(20);

alter table "public"."students" alter column "home_language" set data type character varying(100) using "home_language"::character varying(100);

alter table "public"."students" alter column "last_name" set data type character varying(255) using "last_name"::character varying(255);

alter table "public"."students" alter column "nickname" set data type character varying(100) using "nickname"::character varying(100);

alter table "public"."students" alter column "payment_method" set data type character varying(50) using "payment_method"::character varying(50);

alter table "public"."students" alter column "previous_preschool" set data type character varying(255) using "previous_preschool"::character varying(255);

alter table "public"."students" alter column "registration_fee" set data type character varying(50) using "registration_fee"::character varying(50);

alter table "public"."students" alter column "sex" set data type character varying(20) using "sex"::character varying(20);

alter table "public"."students" alter column "time_block" set data type character varying(100) using "time_block"::character varying(100);

alter table "public"."users" drop column "full_name";

alter table "public"."users" add column "emergency_contact_1_name" character varying(255);

alter table "public"."users" add column "emergency_contact_1_phone" character varying(50);

alter table "public"."users" add column "emergency_contact_1_relationship" character varying(100);

alter table "public"."users" add column "emergency_contact_2_name" character varying(255);

alter table "public"."users" add column "emergency_contact_2_phone" character varying(50);

alter table "public"."users" add column "emergency_contact_2_relationship" character varying(100);

alter table "public"."users" add column "home_city" character varying(100);

alter table "public"."users" add column "home_postal_code" character varying(20);

alter table "public"."users" add column "password_hash" character varying(255);

alter table "public"."users" add column "pickup_authorized" text;

alter table "public"."users" add column "profile_completed_at" timestamp with time zone;

alter table "public"."users" add column "profile_completion_status" character varying(50) default 'incomplete'::character varying;

alter table "public"."users" add column "relationship_to_child" character varying(100) default 'parent'::character varying;

alter table "public"."users" add column "subscription_expires_at" timestamp with time zone;

alter table "public"."users" add column "subscription_features" jsonb default '{}'::jsonb;

alter table "public"."users" add column "subscription_tier" character varying(20) default 'free'::character varying;

alter table "public"."users" add column "work_address" text;

alter table "public"."users" add column "work_company" character varying(255);

alter table "public"."users" add column "work_phone" character varying(50);

alter table "public"."users" add column "work_position" character varying(255);

alter table "public"."users" alter column "email" set data type character varying(255) using "email"::character varying(255);

alter table "public"."users" alter column "name" set not null;

alter table "public"."users" alter column "name" set data type character varying(255) using "name"::character varying(255);

alter table "public"."users" alter column "phone" set data type character varying(20) using "phone"::character varying(20);

alter table "public"."users" alter column "role" set data type character varying(20) using "role"::character varying(20);

CREATE UNIQUE INDEX addresses_pkey ON public.addresses USING btree (id);

CREATE UNIQUE INDEX class_assignments_class_id_academic_year_status_key ON public.class_assignments USING btree (class_id, academic_year, status);

CREATE UNIQUE INDEX class_assignments_pkey ON public.class_assignments USING btree (id);

CREATE UNIQUE INDEX emergency_contacts_pkey ON public.emergency_contacts USING btree (id);

CREATE INDEX idx_addresses_type ON public.addresses USING btree (address_type);

CREATE INDEX idx_addresses_user_id ON public.addresses USING btree (user_id);

CREATE INDEX idx_age_groups_age_range ON public.age_groups USING btree (min_age, max_age);

CREATE INDEX idx_class_assignments_class ON public.class_assignments USING btree (class_id);

CREATE INDEX idx_class_assignments_status ON public.class_assignments USING btree (status);

CREATE INDEX idx_class_assignments_teacher ON public.class_assignments USING btree (teacher_id);

CREATE INDEX idx_class_assignments_year ON public.class_assignments USING btree (academic_year);

CREATE INDEX idx_classes_preschool_id ON public.classes USING btree (preschool_id);

CREATE INDEX idx_emergency_contacts_priority ON public.emergency_contacts USING btree (priority_order);

CREATE INDEX idx_emergency_contacts_student_id ON public.emergency_contacts USING btree (student_id);

CREATE INDEX idx_invitation_uses_code ON public.invitation_uses USING btree (invitation_code_id);

CREATE INDEX idx_invitation_uses_status ON public.invitation_uses USING btree (status);

CREATE INDEX idx_lessons_category_age ON public.lessons USING btree (category_id, age_group_id);

CREATE INDEX idx_lessons_public ON public.lessons USING btree (is_public) WHERE (is_public = true);

CREATE INDEX idx_onboarding_preschool_step ON public.tenant_onboarding_steps USING btree (preschool_id, step_name);

CREATE INDEX idx_parent_access_codes_code ON public.parent_access_codes USING btree (code);

CREATE INDEX idx_parent_access_codes_email ON public.parent_access_codes USING btree (parent_email);

CREATE INDEX idx_parent_access_codes_preschool ON public.parent_access_codes USING btree (preschool_id);

CREATE INDEX idx_parent_access_codes_status ON public.parent_access_codes USING btree (status);

CREATE INDEX idx_parent_details_user_id ON public.parent_details USING btree (user_id);

CREATE INDEX idx_preschool_onboarding_admin_email ON public.preschool_onboarding_requests USING btree (admin_email);

CREATE INDEX idx_preschool_onboarding_email ON public.preschool_onboarding_requests USING btree (email);

CREATE INDEX idx_preschool_onboarding_status ON public.preschool_onboarding_requests USING btree (status);

CREATE INDEX idx_preschools_tenant_slug ON public.preschools USING btree (tenant_slug);

CREATE INDEX idx_school_codes_active ON public.school_invitation_codes USING btree (is_active, expires_at);

CREATE INDEX idx_school_codes_code ON public.school_invitation_codes USING btree (code);

CREATE INDEX idx_school_codes_preschool ON public.school_invitation_codes USING btree (preschool_id);

CREATE INDEX idx_school_invitation_codes_code ON public.school_invitation_codes USING btree (code);

CREATE INDEX idx_school_invitation_codes_preschool ON public.school_invitation_codes USING btree (preschool_id);

CREATE INDEX idx_school_invitation_codes_status ON public.school_invitation_codes USING btree (status);

CREATE INDEX idx_student_medical_student_id ON public.student_medical_info USING btree (student_id);

CREATE INDEX idx_student_registrations_code ON public.student_registrations USING btree (school_invitation_code_id);

CREATE INDEX idx_student_registrations_preschool ON public.student_registrations USING btree (preschool_id);

CREATE INDEX idx_students_attendance_days ON public.students USING gin (attendance_days);

CREATE INDEX idx_students_class_id ON public.students USING btree (class_id);

CREATE INDEX idx_students_document_uploads ON public.students USING gin (document_uploads);

CREATE INDEX idx_students_preschool_id ON public.students USING btree (preschool_id);

CREATE INDEX idx_teacher_schedules_assignment ON public.teacher_class_schedules USING btree (class_assignment_id);

CREATE INDEX idx_teacher_schedules_date ON public.teacher_class_schedules USING btree (scheduled_date);

CREATE INDEX idx_teacher_schedules_lesson ON public.teacher_class_schedules USING btree (lesson_id);

CREATE INDEX idx_teacher_schedules_status ON public.teacher_class_schedules USING btree (status);

CREATE INDEX idx_tenant_invitations_email ON public.tenant_invitations USING btree (email);

CREATE INDEX idx_tenant_invitations_preschool ON public.tenant_invitations USING btree (preschool_id);

CREATE INDEX idx_tenant_invitations_status ON public.tenant_invitations USING btree (status);

CREATE INDEX idx_tenant_invitations_token ON public.tenant_invitations USING btree (invitation_token);

CREATE INDEX idx_users_auth_user_id ON public.users USING btree (auth_user_id);

CREATE INDEX idx_users_emergency_contact_phone ON public.users USING btree (emergency_contact_1_phone);

CREATE INDEX idx_users_preschool_id ON public.users USING btree (preschool_id);

CREATE INDEX idx_users_profile_completion ON public.users USING btree (profile_completion_status);

CREATE INDEX idx_users_role_preschool ON public.users USING btree (role, preschool_id);

CREATE UNIQUE INDEX invitation_uses_pkey ON public.invitation_uses USING btree (id);

CREATE UNIQUE INDEX lesson_categories_pkey ON public.lesson_categories USING btree (id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX parent_access_codes_code_key ON public.parent_access_codes USING btree (code);

CREATE UNIQUE INDEX parent_access_codes_pkey ON public.parent_access_codes USING btree (id);

CREATE UNIQUE INDEX parent_details_pkey ON public.parent_details USING btree (id);

CREATE UNIQUE INDEX parent_details_user_id_key ON public.parent_details USING btree (user_id);

CREATE UNIQUE INDEX premium_features_pkey ON public.premium_features USING btree (id);

CREATE UNIQUE INDEX preschool_onboarding_requests_pkey ON public.preschool_onboarding_requests USING btree (id);

CREATE UNIQUE INDEX preschools_email_key ON public.preschools USING btree (email);

CREATE UNIQUE INDEX preschools_tenant_slug_key ON public.preschools USING btree (tenant_slug);

CREATE UNIQUE INDEX school_invitation_codes_code_key ON public.school_invitation_codes USING btree (code);

CREATE UNIQUE INDEX school_invitation_codes_pkey ON public.school_invitation_codes USING btree (id);

CREATE UNIQUE INDEX student_medical_info_pkey ON public.student_medical_info USING btree (id);

CREATE UNIQUE INDEX student_medical_info_student_id_key ON public.student_medical_info USING btree (student_id);

CREATE UNIQUE INDEX student_registrations_pkey ON public.student_registrations USING btree (id);

CREATE UNIQUE INDEX teacher_class_schedules_pkey ON public.teacher_class_schedules USING btree (id);

CREATE UNIQUE INDEX tenant_invitations_invitation_token_key ON public.tenant_invitations USING btree (invitation_token);

CREATE UNIQUE INDEX tenant_invitations_pkey ON public.tenant_invitations USING btree (id);

CREATE UNIQUE INDEX tenant_onboarding_steps_pkey ON public.tenant_onboarding_steps USING btree (id);

CREATE UNIQUE INDEX tenant_settings_pkey ON public.tenant_settings USING btree (id);

CREATE UNIQUE INDEX tenant_settings_preschool_id_setting_key_key ON public.tenant_settings USING btree (preschool_id, setting_key);

CREATE UNIQUE INDEX unique_lesson_title ON public.lessons USING btree (title);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

alter table "public"."addresses" add constraint "addresses_pkey" PRIMARY KEY using index "addresses_pkey";

alter table "public"."class_assignments" add constraint "class_assignments_pkey" PRIMARY KEY using index "class_assignments_pkey";

alter table "public"."emergency_contacts" add constraint "emergency_contacts_pkey" PRIMARY KEY using index "emergency_contacts_pkey";

alter table "public"."invitation_uses" add constraint "invitation_uses_pkey" PRIMARY KEY using index "invitation_uses_pkey";

alter table "public"."lesson_categories" add constraint "lesson_categories_pkey" PRIMARY KEY using index "lesson_categories_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."parent_access_codes" add constraint "parent_access_codes_pkey" PRIMARY KEY using index "parent_access_codes_pkey";

alter table "public"."parent_details" add constraint "parent_details_pkey" PRIMARY KEY using index "parent_details_pkey";

alter table "public"."premium_features" add constraint "premium_features_pkey" PRIMARY KEY using index "premium_features_pkey";

alter table "public"."preschool_onboarding_requests" add constraint "preschool_onboarding_requests_pkey" PRIMARY KEY using index "preschool_onboarding_requests_pkey";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_pkey" PRIMARY KEY using index "school_invitation_codes_pkey";

alter table "public"."student_medical_info" add constraint "student_medical_info_pkey" PRIMARY KEY using index "student_medical_info_pkey";

alter table "public"."student_registrations" add constraint "student_registrations_pkey" PRIMARY KEY using index "student_registrations_pkey";

alter table "public"."teacher_class_schedules" add constraint "teacher_class_schedules_pkey" PRIMARY KEY using index "teacher_class_schedules_pkey";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_pkey" PRIMARY KEY using index "tenant_invitations_pkey";

alter table "public"."tenant_onboarding_steps" add constraint "tenant_onboarding_steps_pkey" PRIMARY KEY using index "tenant_onboarding_steps_pkey";

alter table "public"."tenant_settings" add constraint "tenant_settings_pkey" PRIMARY KEY using index "tenant_settings_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."activities" add constraint "activities_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE not valid;

alter table "public"."activities" validate constraint "activities_lesson_id_fkey";

alter table "public"."addresses" add constraint "addresses_address_type_check" CHECK (((address_type)::text = ANY ((ARRAY['home'::character varying, 'work'::character varying, 'mailing'::character varying])::text[]))) not valid;

alter table "public"."addresses" validate constraint "addresses_address_type_check";

alter table "public"."addresses" add constraint "addresses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."addresses" validate constraint "addresses_user_id_fkey";

alter table "public"."age_groups" add constraint "age_groups_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) not valid;

alter table "public"."age_groups" validate constraint "age_groups_preschool_id_fkey";

alter table "public"."class_assignments" add constraint "class_assignments_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."class_assignments" validate constraint "class_assignments_assigned_by_fkey";

alter table "public"."class_assignments" add constraint "class_assignments_class_id_academic_year_status_key" UNIQUE using index "class_assignments_class_id_academic_year_status_key" DEFERRABLE INITIALLY DEFERRED;

alter table "public"."class_assignments" add constraint "class_assignments_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE not valid;

alter table "public"."class_assignments" validate constraint "class_assignments_class_id_fkey";

alter table "public"."class_assignments" add constraint "class_assignments_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'archived'::character varying])::text[]))) not valid;

alter table "public"."class_assignments" validate constraint "class_assignments_status_check";

alter table "public"."class_assignments" add constraint "class_assignments_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."class_assignments" validate constraint "class_assignments_teacher_id_fkey";

alter table "public"."classes" add constraint "classes_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."classes" validate constraint "classes_preschool_id_fkey";

alter table "public"."classes" add constraint "classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES users(id) not valid;

alter table "public"."classes" validate constraint "classes_teacher_id_fkey";

alter table "public"."emergency_contacts" add constraint "emergency_contacts_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."emergency_contacts" validate constraint "emergency_contacts_student_id_fkey";

alter table "public"."invitation_uses" add constraint "invitation_uses_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES users(id) not valid;

alter table "public"."invitation_uses" validate constraint "invitation_uses_approved_by_fkey";

alter table "public"."invitation_uses" add constraint "invitation_uses_invitation_code_id_fkey" FOREIGN KEY (invitation_code_id) REFERENCES school_invitation_codes(id) ON DELETE CASCADE not valid;

alter table "public"."invitation_uses" validate constraint "invitation_uses_invitation_code_id_fkey";

alter table "public"."invitation_uses" add constraint "invitation_uses_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."invitation_uses" validate constraint "invitation_uses_status_check";

alter table "public"."invitation_uses" add constraint "invitation_uses_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) not valid;

alter table "public"."invitation_uses" validate constraint "invitation_uses_user_id_fkey";

alter table "public"."lessons" add constraint "lessons_category_id_fkey" FOREIGN KEY (category_id) REFERENCES lesson_categories(id) not valid;

alter table "public"."lessons" validate constraint "lessons_category_id_fkey";

alter table "public"."lessons" add constraint "lessons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."lessons" validate constraint "lessons_created_by_fkey";

alter table "public"."lessons" add constraint "lessons_difficulty_level_check" CHECK (((difficulty_level >= 1) AND (difficulty_level <= 5))) not valid;

alter table "public"."lessons" validate constraint "lessons_difficulty_level_check";

alter table "public"."lessons" add constraint "lessons_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) not valid;

alter table "public"."lessons" validate constraint "lessons_preschool_id_fkey";

alter table "public"."lessons" add constraint "unique_lesson_title" UNIQUE using index "unique_lesson_title";

alter table "public"."parent_access_codes" add constraint "parent_access_codes_code_key" UNIQUE using index "parent_access_codes_code_key";

alter table "public"."parent_access_codes" add constraint "parent_access_codes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."parent_access_codes" validate constraint "parent_access_codes_created_by_fkey";

alter table "public"."parent_access_codes" add constraint "parent_access_codes_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."parent_access_codes" validate constraint "parent_access_codes_preschool_id_fkey";

alter table "public"."parent_access_codes" add constraint "parent_access_codes_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'used'::character varying, 'revoked'::character varying, 'expired'::character varying])::text[]))) not valid;

alter table "public"."parent_access_codes" validate constraint "parent_access_codes_status_check";

alter table "public"."parent_details" add constraint "parent_details_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."parent_details" validate constraint "parent_details_user_id_fkey";

alter table "public"."parent_details" add constraint "parent_details_user_id_key" UNIQUE using index "parent_details_user_id_key";

alter table "public"."preschool_onboarding_requests" add constraint "preschool_onboarding_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES users(id) not valid;

alter table "public"."preschool_onboarding_requests" validate constraint "preschool_onboarding_requests_reviewed_by_fkey";

alter table "public"."preschool_onboarding_requests" add constraint "preschool_onboarding_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."preschool_onboarding_requests" validate constraint "preschool_onboarding_requests_status_check";

alter table "public"."preschools" add constraint "preschools_email_key" UNIQUE using index "preschools_email_key";

alter table "public"."preschools" add constraint "preschools_onboarding_status_check" CHECK (((onboarding_status)::text = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'setup'::character varying, 'completed'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_onboarding_status_check";

alter table "public"."preschools" add constraint "preschools_subscription_plan_check" CHECK (((subscription_plan)::text = ANY ((ARRAY['trial'::character varying, 'basic'::character varying, 'premium'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_subscription_plan_check";

alter table "public"."preschools" add constraint "preschools_subscription_status_check" CHECK (((subscription_status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."preschools" validate constraint "preschools_subscription_status_check";

alter table "public"."preschools" add constraint "preschools_tenant_slug_key" UNIQUE using index "preschools_tenant_slug_key";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_code_key" UNIQUE using index "school_invitation_codes_code_key";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."school_invitation_codes" validate constraint "school_invitation_codes_created_by_fkey";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."school_invitation_codes" validate constraint "school_invitation_codes_preschool_id_fkey";

alter table "public"."school_invitation_codes" add constraint "school_invitation_codes_status_check" CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'used'::character varying, 'revoked'::character varying, 'expired'::character varying])::text[]))) not valid;

alter table "public"."school_invitation_codes" validate constraint "school_invitation_codes_status_check";

alter table "public"."student_medical_info" add constraint "student_medical_info_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."student_medical_info" validate constraint "student_medical_info_student_id_fkey";

alter table "public"."student_medical_info" add constraint "student_medical_info_student_id_key" UNIQUE using index "student_medical_info_student_id_key";

alter table "public"."student_registrations" add constraint "student_registrations_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."student_registrations" validate constraint "student_registrations_preschool_id_fkey";

alter table "public"."student_registrations" add constraint "student_registrations_registered_by_fkey" FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."student_registrations" validate constraint "student_registrations_registered_by_fkey";

alter table "public"."student_registrations" add constraint "student_registrations_school_invitation_code_id_fkey" FOREIGN KEY (school_invitation_code_id) REFERENCES school_invitation_codes(id) ON DELETE CASCADE not valid;

alter table "public"."student_registrations" validate constraint "student_registrations_school_invitation_code_id_fkey";

alter table "public"."student_registrations" add constraint "student_registrations_student_id_fkey" FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE not valid;

alter table "public"."student_registrations" validate constraint "student_registrations_student_id_fkey";

alter table "public"."students" add constraint "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) not valid;

alter table "public"."students" validate constraint "students_class_id_fkey";

alter table "public"."students" add constraint "students_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES users(id) not valid;

alter table "public"."students" validate constraint "students_parent_id_fkey";

alter table "public"."students" add constraint "students_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."students" validate constraint "students_preschool_id_fkey";

alter table "public"."teacher_class_schedules" add constraint "teacher_class_schedules_class_assignment_id_fkey" FOREIGN KEY (class_assignment_id) REFERENCES class_assignments(id) ON DELETE CASCADE not valid;

alter table "public"."teacher_class_schedules" validate constraint "teacher_class_schedules_class_assignment_id_fkey";

alter table "public"."teacher_class_schedules" add constraint "teacher_class_schedules_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE not valid;

alter table "public"."teacher_class_schedules" validate constraint "teacher_class_schedules_lesson_id_fkey";

alter table "public"."teacher_class_schedules" add constraint "teacher_class_schedules_status_check" CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'rescheduled'::character varying])::text[]))) not valid;

alter table "public"."teacher_class_schedules" validate constraint "teacher_class_schedules_status_check";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_accepted_by_fkey" FOREIGN KEY (accepted_by) REFERENCES users(id) not valid;

alter table "public"."tenant_invitations" validate constraint "tenant_invitations_accepted_by_fkey";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_invitation_token_key" UNIQUE using index "tenant_invitations_invitation_token_key";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_invited_by_fkey" FOREIGN KEY (invited_by) REFERENCES users(id) not valid;

alter table "public"."tenant_invitations" validate constraint "tenant_invitations_invited_by_fkey";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_invitations" validate constraint "tenant_invitations_preschool_id_fkey";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_role_check" CHECK (((role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'teacher'::character varying, 'parent'::character varying])::text[]))) not valid;

alter table "public"."tenant_invitations" validate constraint "tenant_invitations_role_check";

alter table "public"."tenant_invitations" add constraint "tenant_invitations_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."tenant_invitations" validate constraint "tenant_invitations_status_check";

alter table "public"."tenant_onboarding_steps" add constraint "tenant_onboarding_steps_completed_by_fkey" FOREIGN KEY (completed_by) REFERENCES users(id) not valid;

alter table "public"."tenant_onboarding_steps" validate constraint "tenant_onboarding_steps_completed_by_fkey";

alter table "public"."tenant_onboarding_steps" add constraint "tenant_onboarding_steps_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_onboarding_steps" validate constraint "tenant_onboarding_steps_preschool_id_fkey";

alter table "public"."tenant_onboarding_steps" add constraint "tenant_onboarding_steps_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'skipped'::character varying])::text[]))) not valid;

alter table "public"."tenant_onboarding_steps" validate constraint "tenant_onboarding_steps_status_check";

alter table "public"."tenant_settings" add constraint "tenant_settings_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."tenant_settings" validate constraint "tenant_settings_preschool_id_fkey";

alter table "public"."tenant_settings" add constraint "tenant_settings_preschool_id_setting_key_key" UNIQUE using index "tenant_settings_preschool_id_setting_key_key";

alter table "public"."user_preferences" add constraint "user_preferences_email_digest_check" CHECK (((email_digest)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'never'::character varying])::text[]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_email_digest_check";

alter table "public"."user_preferences" add constraint "user_preferences_theme_check" CHECK (((theme)::text = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'system'::character varying])::text[]))) not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_theme_check";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_preferences" validate constraint "user_preferences_user_id_fkey";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."users" add constraint "chk_profile_completion_status" CHECK (((profile_completion_status)::text = ANY ((ARRAY['incomplete'::character varying, 'in_progress'::character varying, 'complete'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "chk_profile_completion_status";

alter table "public"."users" add constraint "users_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."users" validate constraint "users_auth_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."users" add constraint "users_preschool_id_fkey" FOREIGN KEY (preschool_id) REFERENCES preschools(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_preschool_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK (((role)::text = ANY ((ARRAY['superadmin'::character varying, 'preschool_admin'::character varying, 'teacher'::character varying, 'parent'::character varying])::text[]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_teacher_to_class(p_class_id uuid, p_teacher_id uuid, p_assigned_by uuid, p_academic_year character varying DEFAULT NULL::character varying)
 RETURNS TABLE(assignment_id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_assignment_id UUID;
    current_year VARCHAR(10);
    teacher_preschool_id UUID;
    class_preschool_id UUID;
BEGIN
    -- Set default academic year if not provided
    IF p_academic_year IS NULL THEN
        current_year := EXTRACT(YEAR FROM NOW())::TEXT || '-' || 
                       (EXTRACT(YEAR FROM NOW()) + 1 - 2000)::TEXT;
    ELSE
        current_year := p_academic_year;
    END IF;
    
    -- Verify teacher and class belong to same preschool
    SELECT preschool_id INTO teacher_preschool_id FROM users WHERE id = p_teacher_id;
    SELECT preschool_id INTO class_preschool_id FROM classes WHERE id = p_class_id;
    
    IF teacher_preschool_id != class_preschool_id THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'Teacher and class must belong to the same preschool';
        RETURN;
    END IF;
    
    -- Check if teacher is actually a teacher
    IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_teacher_id AND role = 'teacher') THEN
        RETURN QUERY SELECT NULL::UUID, FALSE, 'User must have teacher role';
        RETURN;
    END IF;
    
    -- Deactivate any existing assignments for this class and year
    UPDATE class_assignments 
    SET status = 'inactive', updated_at = NOW()
    WHERE class_id = p_class_id AND academic_year = current_year AND status = 'active';
    
    -- Create new assignment
    INSERT INTO class_assignments (class_id, teacher_id, assigned_by, academic_year)
    VALUES (p_class_id, p_teacher_id, p_assigned_by, current_year)
    RETURNING id INTO new_assignment_id;
    
    -- Update the classes table teacher_id for backward compatibility
    UPDATE classes SET teacher_id = p_teacher_id WHERE id = p_class_id;
    
    RETURN QUERY SELECT new_assignment_id, TRUE, 'Teacher successfully assigned to class';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_view_user(checked_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    current_user_preschool_id UUID;
    checked_user_preschool_id UUID;
BEGIN
    -- Get the current user's preschool ID
    SELECT preschool_id INTO current_user_preschool_id 
    FROM users 
    WHERE auth_user_id = auth.uid();

    -- Get the checked user's preschool ID
    SELECT preschool_id INTO checked_user_preschool_id 
    FROM users 
    WHERE id = checked_user_id;

    -- Allow access if:
    -- 1. The user is viewing their own record, OR
    -- 2. The user is in the same preschool
    RETURN 
        checked_user_id IN (
            SELECT id FROM users WHERE auth_user_id = auth.uid()
        ) OR 
        current_user_preschool_id = checked_user_preschool_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_school_invitation_code(p_preschool_id uuid, p_created_by uuid, p_expires_days integer DEFAULT 30, p_max_uses integer DEFAULT NULL::integer, p_description text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, code character varying, expires_at timestamp with time zone, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_code VARCHAR(10);
    new_id UUID;
    expires_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check if user has permission to create codes for this preschool
    IF NOT EXISTS(
        SELECT 1 FROM users 
        WHERE users.id = p_created_by 
        AND users.preschool_id = p_preschool_id 
        AND users.role IN ('preschool_admin', 'superadmin')
    ) THEN
        RETURN QUERY SELECT NULL::UUID, NULL::VARCHAR(10), NULL::TIMESTAMP WITH TIME ZONE, FALSE, 'Unauthorized to create codes for this preschool';
        RETURN;
    END IF;

    -- Generate unique code
    new_code := generate_school_invitation_code();
    expires_date := NOW() + (p_expires_days || ' days')::INTERVAL;
    
    -- Insert new code with all optional parameters
    INSERT INTO school_invitation_codes (
        code, 
        preschool_id, 
        created_by, 
        expires_at,
        max_uses,
        description,
        usage_count
    )
    VALUES (
        new_code, 
        p_preschool_id, 
        p_created_by, 
        expires_date,
        p_max_uses,
        p_description,
        0
    )
    RETURNING school_invitation_codes.id INTO new_id;
    
    RETURN QUERY SELECT new_id, new_code, expires_date, TRUE, 'School invitation code created successfully';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_tenant_with_admin(p_name character varying, p_email character varying, p_admin_name character varying, p_tenant_slug character varying, p_subscription_plan character varying DEFAULT 'basic'::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
    tenant_id UUID;
    admin_user_id UUID;
BEGIN
    -- Create the preschool (tenant)
    INSERT INTO preschools (name, email, tenant_slug, subscription_plan, subscription_status, onboarding_status)
    VALUES (p_name, p_email, p_tenant_slug, p_subscription_plan, 'active', 'setup')
    RETURNING id INTO tenant_id;
    
    -- Create onboarding steps
    INSERT INTO tenant_onboarding_steps (preschool_id, step_name, status) VALUES
    (tenant_id, 'basic_info', 'completed'),
    (tenant_id, 'admin_setup', 'pending'),
    (tenant_id, 'school_setup', 'pending'),
    (tenant_id, 'billing', 'pending'),
    (tenant_id, 'completed', 'pending');
    
    -- Create invitation for admin user
    INSERT INTO tenant_invitations (preschool_id, email, role, invited_by, invitation_token, expires_at)
    VALUES (
        tenant_id, 
        p_email, 
        'preschool_admin', 
        (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1),
        encode(gen_random_bytes(32), 'hex'),
        NOW() + INTERVAL '7 days'
    );
    
    RETURN tenant_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.decrement_class_enrollment(class_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE classes 
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = class_id_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.drop_policy_if_exists(table_name text, policy_name text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, table_name);
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop policy % on %', policy_name, table_name;
    END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
 RETURNS SETOF record
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY EXECUTE sql_query;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_school_code()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN 'SCH-' || TO_CHAR(NOW(), 'YYYY') || '-' || UPPER(substring(md5(random()::text) from 1 for 6));
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_school_invitation_code()
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_code VARCHAR(10);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 8-character code with letters and numbers
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if this code already exists
        SELECT EXISTS(SELECT 1 FROM school_invitation_codes WHERE code = new_code) INTO code_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_teacher_classes(p_teacher_id uuid)
 RETURNS TABLE(class_id uuid, class_name character varying, room_number character varying, age_group_name character varying, student_count bigint, assignment_status character varying, academic_year character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.room_number,
        ag.name,
        COUNT(s.id) as student_count,
        ca.status,
        ca.academic_year
    FROM class_assignments ca
    JOIN classes c ON c.id = ca.class_id
    JOIN age_groups ag ON ag.id = c.age_group_id
    LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
    WHERE ca.teacher_id = p_teacher_id AND ca.status = 'active'
    GROUP BY c.id, c.name, c.room_number, ag.name, ca.status, ca.academic_year
    ORDER BY c.name;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_teacher_daily_schedule(p_teacher_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(schedule_id uuid, class_name character varying, lesson_title character varying, scheduled_time time without time zone, duration_minutes integer, status character varying, lesson_category character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        tcs.id,
        c.name,
        l.title,
        tcs.scheduled_time,
        tcs.duration_minutes,
        tcs.status,
        lc.name
    FROM teacher_class_schedules tcs
    JOIN class_assignments ca ON ca.id = tcs.class_assignment_id
    JOIN classes c ON c.id = ca.class_id
    JOIN lessons l ON l.id = tcs.lesson_id
    LEFT JOIN lesson_categories lc ON lc.id = l.category_id
    WHERE ca.teacher_id = p_teacher_id 
    AND tcs.scheduled_date = p_date
    AND ca.status = 'active'
    ORDER BY tcs.scheduled_time;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_uuid uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    tenant_id UUID;
BEGIN
    SELECT preschool_id INTO tenant_id 
    FROM users 
    WHERE auth_user_id = user_uuid
    LIMIT 1;
    
    RETURN tenant_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_class_enrollment(class_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE classes 
    SET current_enrollment = current_enrollment + 1 
    WHERE id = class_id_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_class_enrollment(class_id_param uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE classes 
    SET current_enrollment = (
        SELECT COUNT(*) 
        FROM students 
        WHERE class_id = class_id_param AND is_active = true
    )
    WHERE id = class_id_param;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.register_student_with_code(p_code character varying, p_student_first_name character varying, p_student_last_name character varying, p_date_of_birth date, p_age_group_id uuid, p_parent_id uuid, p_emergency_contact_name character varying DEFAULT NULL::character varying, p_emergency_contact_phone character varying DEFAULT NULL::character varying, p_allergies text DEFAULT NULL::text, p_special_needs text DEFAULT NULL::text)
 RETURNS TABLE(student_id uuid, registration_id uuid, success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    code_info RECORD;
    new_student_id UUID;
    new_registration_id UUID;
BEGIN
    -- Validate the invitation code
    SELECT * INTO code_info FROM validate_school_invitation_code(p_code) LIMIT 1;
    
    IF NOT code_info.is_valid THEN
        RETURN QUERY SELECT NULL::UUID, NULL::UUID, FALSE, 'Invalid or expired invitation code';
        RETURN;
    END IF;
    
    -- Create the student record
    INSERT INTO students (
        preschool_id,
        first_name,
        last_name,
        date_of_birth,
        age_group_id,
        parent_id,
        emergency_contact_name,
        emergency_contact_phone,
        allergies,
        special_needs
    ) VALUES (
        code_info.preschool_id,
        p_student_first_name,
        p_student_last_name,
        p_date_of_birth,
        p_age_group_id,
        p_parent_id,
        p_emergency_contact_name,
        p_emergency_contact_phone,
        p_allergies,
        p_special_needs
    ) RETURNING id INTO new_student_id;
    
    -- Create the registration record
    INSERT INTO student_registrations (
        preschool_id,
        student_id,
        registered_by,
        school_invitation_code_id
    ) VALUES (
        code_info.preschool_id,
        new_student_id,
        p_parent_id,
        code_info.id
    ) RETURNING id INTO new_registration_id;
    
    -- Update the parent's preschool_id if not already set
    UPDATE users 
    SET preschool_id = code_info.preschool_id 
    WHERE id = p_parent_id AND preschool_id IS NULL;
    
    RETURN QUERY SELECT new_student_id, new_registration_id, TRUE, 'Student registered successfully';
END;
$function$
;

create or replace view "public"."student_complete_info" as  SELECT s.id,
    s.preschool_id,
    s.class_id,
    s.first_name,
    s.last_name,
    s.date_of_birth,
    s.age_group_id,
    s.parent_id,
    s.emergency_contact_name,
    s.emergency_contact_phone,
    s.allergies,
    s.special_needs,
    s.enrollment_date,
    s.is_active,
    s.created_at,
    s.gender,
    s.previous_school_experience,
    s.additional_notes,
    smi.allergies AS medical_allergies,
    smi.medical_conditions,
    smi.current_medications,
    smi.doctor_name,
    smi.doctor_phone,
    ec.contact_name AS primary_emergency_contact,
    ec.contact_phone AS primary_emergency_phone,
    ec.relationship AS primary_emergency_relation,
    pd.primary_parent_name,
    pd.primary_parent_phone,
    pd.primary_parent_email,
    pd.secondary_parent_name,
    a.street_address,
    a.city,
    a.province,
    a.postal_code
   FROM (((((students s
     LEFT JOIN student_medical_info smi ON ((s.id = smi.student_id)))
     LEFT JOIN emergency_contacts ec ON (((s.id = ec.student_id) AND (ec.priority_order = 1))))
     LEFT JOIN users u ON ((s.parent_id = u.id)))
     LEFT JOIN parent_details pd ON ((u.id = pd.user_id)))
     LEFT JOIN addresses a ON (((u.id = a.user_id) AND (a.is_primary = true))));


CREATE OR REPLACE FUNCTION public.update_class_enrollment_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        IF NEW.class_id IS NOT NULL AND NEW.is_active = true THEN
            PERFORM increment_class_enrollment(NEW.class_id);
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Student moved from one class to another
        IF OLD.class_id != NEW.class_id THEN
            -- Decrement old class
            IF OLD.class_id IS NOT NULL AND OLD.is_active = true THEN
                PERFORM decrement_class_enrollment(OLD.class_id);
            END IF;
            -- Increment new class
            IF NEW.class_id IS NOT NULL AND NEW.is_active = true THEN
                PERFORM increment_class_enrollment(NEW.class_id);
            END IF;
        -- Student status changed (active/inactive)
        ELSIF OLD.is_active != NEW.is_active AND NEW.class_id IS NOT NULL THEN
            IF NEW.is_active = true THEN
                PERFORM increment_class_enrollment(NEW.class_id);
            ELSE
                PERFORM decrement_class_enrollment(NEW.class_id);
            END IF;
        END IF;
        RETURN NEW;
    END IF;
    
    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.class_id IS NOT NULL AND OLD.is_active = true THEN
            PERFORM decrement_class_enrollment(OLD.class_id);
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.use_school_invitation_code(p_code text, p_parent_email text, p_child_name text)
 RETURNS TABLE(success boolean, message text, preschool_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    code_record RECORD;
    use_id UUID;
BEGIN
    -- Find and validate the code
    SELECT * INTO code_record
    FROM school_invitation_codes
    WHERE code = p_code
    AND is_active = true
    AND expires_at > NOW()
    AND current_uses < max_uses;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Invalid, expired, or exhausted invitation code', NULL::UUID;
        RETURN;
    END IF;
    
    -- Record the use
    INSERT INTO invitation_uses (invitation_code_id, parent_email, child_name)
    VALUES (code_record.id, p_parent_email, p_child_name)
    RETURNING id INTO use_id;
    
    -- Increment usage count
    UPDATE school_invitation_codes
    SET current_uses = current_uses + 1
    WHERE id = code_record.id;
    
    RETURN QUERY SELECT true, 'Invitation code used successfully', code_record.preschool_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_school_invitation_code(p_code character varying)
 RETURNS TABLE(id uuid, preschool_id uuid, preschool_name character varying, tenant_slug character varying, expires_at timestamp with time zone, is_valid boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        sic.id,
        sic.preschool_id,
        p.name as preschool_name,
        p.tenant_slug,
        sic.expires_at,
        (sic.status = 'active' AND sic.expires_at > NOW()) as is_valid
    FROM school_invitation_codes sic
    JOIN preschools p ON p.id = sic.preschool_id
    WHERE sic.code = p_code;
END;
$function$
;

grant delete on table "public"."addresses" to "anon";

grant insert on table "public"."addresses" to "anon";

grant references on table "public"."addresses" to "anon";

grant select on table "public"."addresses" to "anon";

grant trigger on table "public"."addresses" to "anon";

grant truncate on table "public"."addresses" to "anon";

grant update on table "public"."addresses" to "anon";

grant delete on table "public"."addresses" to "authenticated";

grant insert on table "public"."addresses" to "authenticated";

grant references on table "public"."addresses" to "authenticated";

grant select on table "public"."addresses" to "authenticated";

grant trigger on table "public"."addresses" to "authenticated";

grant truncate on table "public"."addresses" to "authenticated";

grant update on table "public"."addresses" to "authenticated";

grant delete on table "public"."addresses" to "service_role";

grant insert on table "public"."addresses" to "service_role";

grant references on table "public"."addresses" to "service_role";

grant select on table "public"."addresses" to "service_role";

grant trigger on table "public"."addresses" to "service_role";

grant truncate on table "public"."addresses" to "service_role";

grant update on table "public"."addresses" to "service_role";

grant delete on table "public"."class_assignments" to "anon";

grant insert on table "public"."class_assignments" to "anon";

grant references on table "public"."class_assignments" to "anon";

grant select on table "public"."class_assignments" to "anon";

grant trigger on table "public"."class_assignments" to "anon";

grant truncate on table "public"."class_assignments" to "anon";

grant update on table "public"."class_assignments" to "anon";

grant delete on table "public"."class_assignments" to "authenticated";

grant insert on table "public"."class_assignments" to "authenticated";

grant references on table "public"."class_assignments" to "authenticated";

grant select on table "public"."class_assignments" to "authenticated";

grant trigger on table "public"."class_assignments" to "authenticated";

grant truncate on table "public"."class_assignments" to "authenticated";

grant update on table "public"."class_assignments" to "authenticated";

grant delete on table "public"."class_assignments" to "service_role";

grant insert on table "public"."class_assignments" to "service_role";

grant references on table "public"."class_assignments" to "service_role";

grant select on table "public"."class_assignments" to "service_role";

grant trigger on table "public"."class_assignments" to "service_role";

grant truncate on table "public"."class_assignments" to "service_role";

grant update on table "public"."class_assignments" to "service_role";

grant delete on table "public"."emergency_contacts" to "anon";

grant insert on table "public"."emergency_contacts" to "anon";

grant references on table "public"."emergency_contacts" to "anon";

grant select on table "public"."emergency_contacts" to "anon";

grant trigger on table "public"."emergency_contacts" to "anon";

grant truncate on table "public"."emergency_contacts" to "anon";

grant update on table "public"."emergency_contacts" to "anon";

grant delete on table "public"."emergency_contacts" to "authenticated";

grant insert on table "public"."emergency_contacts" to "authenticated";

grant references on table "public"."emergency_contacts" to "authenticated";

grant select on table "public"."emergency_contacts" to "authenticated";

grant trigger on table "public"."emergency_contacts" to "authenticated";

grant truncate on table "public"."emergency_contacts" to "authenticated";

grant update on table "public"."emergency_contacts" to "authenticated";

grant delete on table "public"."emergency_contacts" to "service_role";

grant insert on table "public"."emergency_contacts" to "service_role";

grant references on table "public"."emergency_contacts" to "service_role";

grant select on table "public"."emergency_contacts" to "service_role";

grant trigger on table "public"."emergency_contacts" to "service_role";

grant truncate on table "public"."emergency_contacts" to "service_role";

grant update on table "public"."emergency_contacts" to "service_role";

grant delete on table "public"."invitation_uses" to "anon";

grant insert on table "public"."invitation_uses" to "anon";

grant references on table "public"."invitation_uses" to "anon";

grant select on table "public"."invitation_uses" to "anon";

grant trigger on table "public"."invitation_uses" to "anon";

grant truncate on table "public"."invitation_uses" to "anon";

grant update on table "public"."invitation_uses" to "anon";

grant delete on table "public"."invitation_uses" to "authenticated";

grant insert on table "public"."invitation_uses" to "authenticated";

grant references on table "public"."invitation_uses" to "authenticated";

grant select on table "public"."invitation_uses" to "authenticated";

grant trigger on table "public"."invitation_uses" to "authenticated";

grant truncate on table "public"."invitation_uses" to "authenticated";

grant update on table "public"."invitation_uses" to "authenticated";

grant delete on table "public"."invitation_uses" to "service_role";

grant insert on table "public"."invitation_uses" to "service_role";

grant references on table "public"."invitation_uses" to "service_role";

grant select on table "public"."invitation_uses" to "service_role";

grant trigger on table "public"."invitation_uses" to "service_role";

grant truncate on table "public"."invitation_uses" to "service_role";

grant update on table "public"."invitation_uses" to "service_role";

grant delete on table "public"."lesson_categories" to "anon";

grant insert on table "public"."lesson_categories" to "anon";

grant references on table "public"."lesson_categories" to "anon";

grant select on table "public"."lesson_categories" to "anon";

grant trigger on table "public"."lesson_categories" to "anon";

grant truncate on table "public"."lesson_categories" to "anon";

grant update on table "public"."lesson_categories" to "anon";

grant delete on table "public"."lesson_categories" to "authenticated";

grant insert on table "public"."lesson_categories" to "authenticated";

grant references on table "public"."lesson_categories" to "authenticated";

grant select on table "public"."lesson_categories" to "authenticated";

grant trigger on table "public"."lesson_categories" to "authenticated";

grant truncate on table "public"."lesson_categories" to "authenticated";

grant update on table "public"."lesson_categories" to "authenticated";

grant delete on table "public"."lesson_categories" to "service_role";

grant insert on table "public"."lesson_categories" to "service_role";

grant references on table "public"."lesson_categories" to "service_role";

grant select on table "public"."lesson_categories" to "service_role";

grant trigger on table "public"."lesson_categories" to "service_role";

grant truncate on table "public"."lesson_categories" to "service_role";

grant update on table "public"."lesson_categories" to "service_role";

grant delete on table "public"."lessons" to "anon";

grant insert on table "public"."lessons" to "anon";

grant references on table "public"."lessons" to "anon";

grant select on table "public"."lessons" to "anon";

grant trigger on table "public"."lessons" to "anon";

grant truncate on table "public"."lessons" to "anon";

grant update on table "public"."lessons" to "anon";

grant delete on table "public"."lessons" to "authenticated";

grant insert on table "public"."lessons" to "authenticated";

grant references on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "authenticated";

grant trigger on table "public"."lessons" to "authenticated";

grant truncate on table "public"."lessons" to "authenticated";

grant update on table "public"."lessons" to "authenticated";

grant delete on table "public"."lessons" to "service_role";

grant insert on table "public"."lessons" to "service_role";

grant references on table "public"."lessons" to "service_role";

grant select on table "public"."lessons" to "service_role";

grant trigger on table "public"."lessons" to "service_role";

grant truncate on table "public"."lessons" to "service_role";

grant update on table "public"."lessons" to "service_role";

grant delete on table "public"."parent_access_codes" to "anon";

grant insert on table "public"."parent_access_codes" to "anon";

grant references on table "public"."parent_access_codes" to "anon";

grant select on table "public"."parent_access_codes" to "anon";

grant trigger on table "public"."parent_access_codes" to "anon";

grant truncate on table "public"."parent_access_codes" to "anon";

grant update on table "public"."parent_access_codes" to "anon";

grant delete on table "public"."parent_access_codes" to "authenticated";

grant insert on table "public"."parent_access_codes" to "authenticated";

grant references on table "public"."parent_access_codes" to "authenticated";

grant select on table "public"."parent_access_codes" to "authenticated";

grant trigger on table "public"."parent_access_codes" to "authenticated";

grant truncate on table "public"."parent_access_codes" to "authenticated";

grant update on table "public"."parent_access_codes" to "authenticated";

grant delete on table "public"."parent_access_codes" to "service_role";

grant insert on table "public"."parent_access_codes" to "service_role";

grant references on table "public"."parent_access_codes" to "service_role";

grant select on table "public"."parent_access_codes" to "service_role";

grant trigger on table "public"."parent_access_codes" to "service_role";

grant truncate on table "public"."parent_access_codes" to "service_role";

grant update on table "public"."parent_access_codes" to "service_role";

grant delete on table "public"."parent_details" to "anon";

grant insert on table "public"."parent_details" to "anon";

grant references on table "public"."parent_details" to "anon";

grant select on table "public"."parent_details" to "anon";

grant trigger on table "public"."parent_details" to "anon";

grant truncate on table "public"."parent_details" to "anon";

grant update on table "public"."parent_details" to "anon";

grant delete on table "public"."parent_details" to "authenticated";

grant insert on table "public"."parent_details" to "authenticated";

grant references on table "public"."parent_details" to "authenticated";

grant select on table "public"."parent_details" to "authenticated";

grant trigger on table "public"."parent_details" to "authenticated";

grant truncate on table "public"."parent_details" to "authenticated";

grant update on table "public"."parent_details" to "authenticated";

grant delete on table "public"."parent_details" to "service_role";

grant insert on table "public"."parent_details" to "service_role";

grant references on table "public"."parent_details" to "service_role";

grant select on table "public"."parent_details" to "service_role";

grant trigger on table "public"."parent_details" to "service_role";

grant truncate on table "public"."parent_details" to "service_role";

grant update on table "public"."parent_details" to "service_role";

grant delete on table "public"."premium_features" to "anon";

grant insert on table "public"."premium_features" to "anon";

grant references on table "public"."premium_features" to "anon";

grant select on table "public"."premium_features" to "anon";

grant trigger on table "public"."premium_features" to "anon";

grant truncate on table "public"."premium_features" to "anon";

grant update on table "public"."premium_features" to "anon";

grant delete on table "public"."premium_features" to "authenticated";

grant insert on table "public"."premium_features" to "authenticated";

grant references on table "public"."premium_features" to "authenticated";

grant select on table "public"."premium_features" to "authenticated";

grant trigger on table "public"."premium_features" to "authenticated";

grant truncate on table "public"."premium_features" to "authenticated";

grant update on table "public"."premium_features" to "authenticated";

grant delete on table "public"."premium_features" to "service_role";

grant insert on table "public"."premium_features" to "service_role";

grant references on table "public"."premium_features" to "service_role";

grant select on table "public"."premium_features" to "service_role";

grant trigger on table "public"."premium_features" to "service_role";

grant truncate on table "public"."premium_features" to "service_role";

grant update on table "public"."premium_features" to "service_role";

grant delete on table "public"."preschool_onboarding_requests" to "anon";

grant insert on table "public"."preschool_onboarding_requests" to "anon";

grant references on table "public"."preschool_onboarding_requests" to "anon";

grant select on table "public"."preschool_onboarding_requests" to "anon";

grant trigger on table "public"."preschool_onboarding_requests" to "anon";

grant truncate on table "public"."preschool_onboarding_requests" to "anon";

grant update on table "public"."preschool_onboarding_requests" to "anon";

grant delete on table "public"."preschool_onboarding_requests" to "authenticated";

grant insert on table "public"."preschool_onboarding_requests" to "authenticated";

grant references on table "public"."preschool_onboarding_requests" to "authenticated";

grant select on table "public"."preschool_onboarding_requests" to "authenticated";

grant trigger on table "public"."preschool_onboarding_requests" to "authenticated";

grant truncate on table "public"."preschool_onboarding_requests" to "authenticated";

grant update on table "public"."preschool_onboarding_requests" to "authenticated";

grant delete on table "public"."preschool_onboarding_requests" to "service_role";

grant insert on table "public"."preschool_onboarding_requests" to "service_role";

grant references on table "public"."preschool_onboarding_requests" to "service_role";

grant select on table "public"."preschool_onboarding_requests" to "service_role";

grant trigger on table "public"."preschool_onboarding_requests" to "service_role";

grant truncate on table "public"."preschool_onboarding_requests" to "service_role";

grant update on table "public"."preschool_onboarding_requests" to "service_role";

grant delete on table "public"."school_invitation_codes" to "anon";

grant insert on table "public"."school_invitation_codes" to "anon";

grant references on table "public"."school_invitation_codes" to "anon";

grant select on table "public"."school_invitation_codes" to "anon";

grant trigger on table "public"."school_invitation_codes" to "anon";

grant truncate on table "public"."school_invitation_codes" to "anon";

grant update on table "public"."school_invitation_codes" to "anon";

grant delete on table "public"."school_invitation_codes" to "authenticated";

grant insert on table "public"."school_invitation_codes" to "authenticated";

grant references on table "public"."school_invitation_codes" to "authenticated";

grant select on table "public"."school_invitation_codes" to "authenticated";

grant trigger on table "public"."school_invitation_codes" to "authenticated";

grant truncate on table "public"."school_invitation_codes" to "authenticated";

grant update on table "public"."school_invitation_codes" to "authenticated";

grant delete on table "public"."school_invitation_codes" to "service_role";

grant insert on table "public"."school_invitation_codes" to "service_role";

grant references on table "public"."school_invitation_codes" to "service_role";

grant select on table "public"."school_invitation_codes" to "service_role";

grant trigger on table "public"."school_invitation_codes" to "service_role";

grant truncate on table "public"."school_invitation_codes" to "service_role";

grant update on table "public"."school_invitation_codes" to "service_role";

grant delete on table "public"."student_medical_info" to "anon";

grant insert on table "public"."student_medical_info" to "anon";

grant references on table "public"."student_medical_info" to "anon";

grant select on table "public"."student_medical_info" to "anon";

grant trigger on table "public"."student_medical_info" to "anon";

grant truncate on table "public"."student_medical_info" to "anon";

grant update on table "public"."student_medical_info" to "anon";

grant delete on table "public"."student_medical_info" to "authenticated";

grant insert on table "public"."student_medical_info" to "authenticated";

grant references on table "public"."student_medical_info" to "authenticated";

grant select on table "public"."student_medical_info" to "authenticated";

grant trigger on table "public"."student_medical_info" to "authenticated";

grant truncate on table "public"."student_medical_info" to "authenticated";

grant update on table "public"."student_medical_info" to "authenticated";

grant delete on table "public"."student_medical_info" to "service_role";

grant insert on table "public"."student_medical_info" to "service_role";

grant references on table "public"."student_medical_info" to "service_role";

grant select on table "public"."student_medical_info" to "service_role";

grant trigger on table "public"."student_medical_info" to "service_role";

grant truncate on table "public"."student_medical_info" to "service_role";

grant update on table "public"."student_medical_info" to "service_role";

grant delete on table "public"."student_registrations" to "anon";

grant insert on table "public"."student_registrations" to "anon";

grant references on table "public"."student_registrations" to "anon";

grant select on table "public"."student_registrations" to "anon";

grant trigger on table "public"."student_registrations" to "anon";

grant truncate on table "public"."student_registrations" to "anon";

grant update on table "public"."student_registrations" to "anon";

grant delete on table "public"."student_registrations" to "authenticated";

grant insert on table "public"."student_registrations" to "authenticated";

grant references on table "public"."student_registrations" to "authenticated";

grant select on table "public"."student_registrations" to "authenticated";

grant trigger on table "public"."student_registrations" to "authenticated";

grant truncate on table "public"."student_registrations" to "authenticated";

grant update on table "public"."student_registrations" to "authenticated";

grant delete on table "public"."student_registrations" to "service_role";

grant insert on table "public"."student_registrations" to "service_role";

grant references on table "public"."student_registrations" to "service_role";

grant select on table "public"."student_registrations" to "service_role";

grant trigger on table "public"."student_registrations" to "service_role";

grant truncate on table "public"."student_registrations" to "service_role";

grant update on table "public"."student_registrations" to "service_role";

grant delete on table "public"."teacher_class_schedules" to "anon";

grant insert on table "public"."teacher_class_schedules" to "anon";

grant references on table "public"."teacher_class_schedules" to "anon";

grant select on table "public"."teacher_class_schedules" to "anon";

grant trigger on table "public"."teacher_class_schedules" to "anon";

grant truncate on table "public"."teacher_class_schedules" to "anon";

grant update on table "public"."teacher_class_schedules" to "anon";

grant delete on table "public"."teacher_class_schedules" to "authenticated";

grant insert on table "public"."teacher_class_schedules" to "authenticated";

grant references on table "public"."teacher_class_schedules" to "authenticated";

grant select on table "public"."teacher_class_schedules" to "authenticated";

grant trigger on table "public"."teacher_class_schedules" to "authenticated";

grant truncate on table "public"."teacher_class_schedules" to "authenticated";

grant update on table "public"."teacher_class_schedules" to "authenticated";

grant delete on table "public"."teacher_class_schedules" to "service_role";

grant insert on table "public"."teacher_class_schedules" to "service_role";

grant references on table "public"."teacher_class_schedules" to "service_role";

grant select on table "public"."teacher_class_schedules" to "service_role";

grant trigger on table "public"."teacher_class_schedules" to "service_role";

grant truncate on table "public"."teacher_class_schedules" to "service_role";

grant update on table "public"."teacher_class_schedules" to "service_role";

grant delete on table "public"."tenant_invitations" to "anon";

grant insert on table "public"."tenant_invitations" to "anon";

grant references on table "public"."tenant_invitations" to "anon";

grant select on table "public"."tenant_invitations" to "anon";

grant trigger on table "public"."tenant_invitations" to "anon";

grant truncate on table "public"."tenant_invitations" to "anon";

grant update on table "public"."tenant_invitations" to "anon";

grant delete on table "public"."tenant_invitations" to "authenticated";

grant insert on table "public"."tenant_invitations" to "authenticated";

grant references on table "public"."tenant_invitations" to "authenticated";

grant select on table "public"."tenant_invitations" to "authenticated";

grant trigger on table "public"."tenant_invitations" to "authenticated";

grant truncate on table "public"."tenant_invitations" to "authenticated";

grant update on table "public"."tenant_invitations" to "authenticated";

grant delete on table "public"."tenant_invitations" to "service_role";

grant insert on table "public"."tenant_invitations" to "service_role";

grant references on table "public"."tenant_invitations" to "service_role";

grant select on table "public"."tenant_invitations" to "service_role";

grant trigger on table "public"."tenant_invitations" to "service_role";

grant truncate on table "public"."tenant_invitations" to "service_role";

grant update on table "public"."tenant_invitations" to "service_role";

grant delete on table "public"."tenant_onboarding_steps" to "anon";

grant insert on table "public"."tenant_onboarding_steps" to "anon";

grant references on table "public"."tenant_onboarding_steps" to "anon";

grant select on table "public"."tenant_onboarding_steps" to "anon";

grant trigger on table "public"."tenant_onboarding_steps" to "anon";

grant truncate on table "public"."tenant_onboarding_steps" to "anon";

grant update on table "public"."tenant_onboarding_steps" to "anon";

grant delete on table "public"."tenant_onboarding_steps" to "authenticated";

grant insert on table "public"."tenant_onboarding_steps" to "authenticated";

grant references on table "public"."tenant_onboarding_steps" to "authenticated";

grant select on table "public"."tenant_onboarding_steps" to "authenticated";

grant trigger on table "public"."tenant_onboarding_steps" to "authenticated";

grant truncate on table "public"."tenant_onboarding_steps" to "authenticated";

grant update on table "public"."tenant_onboarding_steps" to "authenticated";

grant delete on table "public"."tenant_onboarding_steps" to "service_role";

grant insert on table "public"."tenant_onboarding_steps" to "service_role";

grant references on table "public"."tenant_onboarding_steps" to "service_role";

grant select on table "public"."tenant_onboarding_steps" to "service_role";

grant trigger on table "public"."tenant_onboarding_steps" to "service_role";

grant truncate on table "public"."tenant_onboarding_steps" to "service_role";

grant update on table "public"."tenant_onboarding_steps" to "service_role";

grant delete on table "public"."tenant_settings" to "anon";

grant insert on table "public"."tenant_settings" to "anon";

grant references on table "public"."tenant_settings" to "anon";

grant select on table "public"."tenant_settings" to "anon";

grant trigger on table "public"."tenant_settings" to "anon";

grant truncate on table "public"."tenant_settings" to "anon";

grant update on table "public"."tenant_settings" to "anon";

grant delete on table "public"."tenant_settings" to "authenticated";

grant insert on table "public"."tenant_settings" to "authenticated";

grant references on table "public"."tenant_settings" to "authenticated";

grant select on table "public"."tenant_settings" to "authenticated";

grant trigger on table "public"."tenant_settings" to "authenticated";

grant truncate on table "public"."tenant_settings" to "authenticated";

grant update on table "public"."tenant_settings" to "authenticated";

grant delete on table "public"."tenant_settings" to "service_role";

grant insert on table "public"."tenant_settings" to "service_role";

grant references on table "public"."tenant_settings" to "service_role";

grant select on table "public"."tenant_settings" to "service_role";

grant trigger on table "public"."tenant_settings" to "service_role";

grant truncate on table "public"."tenant_settings" to "service_role";

grant update on table "public"."tenant_settings" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

create policy "Users can view activities for accessible lessons"
on "public"."activities"
as permissive
for select
to public
using ((lesson_id IN ( SELECT lessons.id
   FROM lessons
  WHERE ((lessons.is_public = true) OR (lessons.preschool_id IN ( SELECT users.preschool_id
           FROM users
          WHERE (users.auth_user_id = auth.uid())))))));


create policy "Preschool staff can view addresses in their preschool"
on "public"."addresses"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users u1,
    users u2
  WHERE ((u1.auth_user_id = auth.uid()) AND ((u1.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'teacher'::character varying])::text[])) AND (u2.id = addresses.user_id) AND (u1.preschool_id = u2.preschool_id)))));


create policy "Users can manage their own addresses"
on "public"."addresses"
as permissive
for all
to public
using ((auth.uid() = ( SELECT users.auth_user_id
   FROM users
  WHERE (users.id = addresses.user_id))));


create policy "Age groups are readable by all"
on "public"."age_groups"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Age groups are viewable by everyone"
on "public"."age_groups"
as permissive
for select
to public
using (true);


create policy "Admins can manage class assignments"
on "public"."class_assignments"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = ( SELECT classes.preschool_id
           FROM classes
          WHERE (classes.id = class_assignments.class_id))) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Teachers can view their class assignments"
on "public"."class_assignments"
as permissive
for select
to public
using (((teacher_id = auth.uid()) OR (auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = ( SELECT classes.preschool_id
           FROM classes
          WHERE (classes.id = class_assignments.class_id))) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[])))))));


create policy "Users can view classes from their preschool"
on "public"."classes"
as permissive
for select
to public
using ((preschool_id IN ( SELECT users.preschool_id
   FROM users
  WHERE (users.auth_user_id = auth.uid()))));


create policy "Parents can manage their children's emergency contacts"
on "public"."emergency_contacts"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM students s,
    users u
  WHERE ((s.id = emergency_contacts.student_id) AND (s.parent_id = u.id) AND (u.auth_user_id = auth.uid())))));


create policy "Preschool staff can view emergency contacts in their preschool"
on "public"."emergency_contacts"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM students s,
    users u
  WHERE ((s.id = emergency_contacts.student_id) AND (u.auth_user_id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'teacher'::character varying])::text[])) AND (s.preschool_id = u.preschool_id)))));


create policy "Users can view invitation uses for their preschool"
on "public"."invitation_uses"
as permissive
for select
to public
using ((invitation_code_id IN ( SELECT sic.id
   FROM (school_invitation_codes sic
     JOIN users u ON ((u.preschool_id = sic.preschool_id)))
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'teacher'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Categories are readable by all"
on "public"."lesson_categories"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Lesson categories are viewable by everyone"
on "public"."lesson_categories"
as permissive
for select
to public
using (true);


create policy "Anyone can view public lessons"
on "public"."lessons"
as permissive
for select
to public
using ((is_public = true));


create policy "Published lessons readable by all"
on "public"."lessons"
as permissive
for select
to public
using (((is_published = true) AND (auth.uid() IS NOT NULL)));


create policy "Users can view lessons from their preschool"
on "public"."lessons"
as permissive
for select
to public
using (((is_public = true) OR (preschool_id IN ( SELECT users.preschool_id
   FROM users
  WHERE (users.auth_user_id = auth.uid())))));


create policy "Preschool admins can create codes"
on "public"."parent_access_codes"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = parent_access_codes.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Preschool admins can update codes"
on "public"."parent_access_codes"
as permissive
for update
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = parent_access_codes.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Public can validate codes"
on "public"."parent_access_codes"
as permissive
for select
to public
using ((((status)::text = 'active'::text) AND (expires_at > now())));


create policy "Users can view codes for their preschool"
on "public"."parent_access_codes"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = parent_access_codes.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Preschool admins can view parent details in their preschool"
on "public"."parent_details"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users u1,
    users u2
  WHERE ((u1.auth_user_id = auth.uid()) AND ((u1.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'teacher'::character varying])::text[])) AND (u2.id = parent_details.user_id) AND (u1.preschool_id = u2.preschool_id)))));


create policy "Users can insert their own parent details"
on "public"."parent_details"
as permissive
for insert
to public
with check ((auth.uid() = ( SELECT users.auth_user_id
   FROM users
  WHERE (users.id = parent_details.user_id))));


create policy "Users can update their own parent details"
on "public"."parent_details"
as permissive
for update
to public
using ((auth.uid() = ( SELECT users.auth_user_id
   FROM users
  WHERE (users.id = parent_details.user_id))));


create policy "Users can view their own parent details"
on "public"."parent_details"
as permissive
for select
to public
using ((auth.uid() = ( SELECT users.auth_user_id
   FROM users
  WHERE (users.id = parent_details.user_id))));


create policy "All users can read premium features"
on "public"."premium_features"
as permissive
for select
to public
using ((auth.uid() IS NOT NULL));


create policy "Anyone can submit onboarding requests"
on "public"."preschool_onboarding_requests"
as permissive
for insert
to public
with check (true);


create policy "System admins can update onboarding requests"
on "public"."preschool_onboarding_requests"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.auth_user_id = auth.uid()) AND ((users.role)::text = 'system_admin'::text)))));


create policy "System admins can view all onboarding requests"
on "public"."preschool_onboarding_requests"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.auth_user_id = auth.uid()) AND ((users.role)::text = 'system_admin'::text)))));


create policy "Allow authenticated access to preschools"
on "public"."preschools"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can view their own preschool"
on "public"."preschools"
as permissive
for select
to public
using ((id IN ( SELECT users.preschool_id
   FROM users
  WHERE (users.auth_user_id = auth.uid()))));


create policy "Preschool admins can manage school codes"
on "public"."school_invitation_codes"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = school_invitation_codes.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Preschool admins can manage their codes"
on "public"."school_invitation_codes"
as permissive
for all
to public
using ((preschool_id IN ( SELECT users.preschool_id
   FROM users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Public can validate school codes"
on "public"."school_invitation_codes"
as permissive
for select
to public
using ((((status)::text = 'active'::text) AND (expires_at > now())));


create policy "Parents can manage their children's medical info"
on "public"."student_medical_info"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM students s,
    users u
  WHERE ((s.id = student_medical_info.student_id) AND (s.parent_id = u.id) AND (u.auth_user_id = auth.uid())))));


create policy "Preschool staff can view medical info in their preschool"
on "public"."student_medical_info"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM students s,
    users u
  WHERE ((s.id = student_medical_info.student_id) AND (u.auth_user_id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'teacher'::character varying])::text[])) AND (s.preschool_id = u.preschool_id)))));


create policy "Registrations must match school and student"
on "public"."student_registrations"
as permissive
for all
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = student_registrations.preschool_id) AND ((users.role)::text = ANY ((ARRAY['parent'::character varying, 'preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Users can view students from their preschool"
on "public"."students"
as permissive
for select
to public
using ((preschool_id IN ( SELECT users.preschool_id
   FROM users
  WHERE (users.auth_user_id = auth.uid()))));


create policy "Teachers can manage their class schedules"
on "public"."teacher_class_schedules"
as permissive
for all
to public
using (((class_assignment_id IN ( SELECT class_assignments.id
   FROM class_assignments
  WHERE (class_assignments.teacher_id = auth.uid()))) OR (auth.uid() IN ( SELECT users.id
   FROM users
  WHERE (((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[])) AND (users.preschool_id = ( SELECT c.preschool_id
           FROM (classes c
             JOIN class_assignments ca ON ((ca.class_id = c.id)))
          WHERE (ca.id = teacher_class_schedules.class_assignment_id))))))));


create policy "Allow authenticated access to tenant invitations"
on "public"."tenant_invitations"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Anyone can view invitations with valid token"
on "public"."tenant_invitations"
as permissive
for select
to public
using (true);


create policy "Preschool admins can create invitations"
on "public"."tenant_invitations"
as permissive
for insert
to public
with check ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = tenant_invitations.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Preschool admins can update invitations"
on "public"."tenant_invitations"
as permissive
for update
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = tenant_invitations.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Users can view invitations for their preschool"
on "public"."tenant_invitations"
as permissive
for select
to public
using ((auth.uid() IN ( SELECT users.id
   FROM users
  WHERE ((users.preschool_id = tenant_invitations.preschool_id) AND ((users.role)::text = ANY ((ARRAY['preschool_admin'::character varying, 'superadmin'::character varying])::text[]))))));


create policy "Allow authenticated access to onboarding steps"
on "public"."tenant_onboarding_steps"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Allow authenticated access to tenant settings"
on "public"."tenant_settings"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can manage their own preferences"
on "public"."user_preferences"
as permissive
for all
to public
using ((user_id = auth.uid()));


create policy "Allow all access for authenticated users"
on "public"."users"
as permissive
for all
to public
using ((auth.role() = 'authenticated'::text));


create policy "Users can update own profile"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = auth_user_id));


create policy "Users can view own profile"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = auth_user_id));


create policy "Users can view users from their preschool"
on "public"."users"
as permissive
for select
to public
using (can_view_user(id));


CREATE TRIGGER update_class_assignments_updated_at BEFORE UPDATE ON public.class_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parent_access_codes_updated_at BEFORE UPDATE ON public.parent_access_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_invitation_codes_updated_at BEFORE UPDATE ON public.school_invitation_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_registrations_updated_at BEFORE UPDATE ON public.student_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER students_enrollment_trigger AFTER INSERT OR DELETE OR UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_class_enrollment_trigger();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teacher_class_schedules_updated_at BEFORE UPDATE ON public.teacher_class_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_invitations_updated_at BEFORE UPDATE ON public.tenant_invitations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


