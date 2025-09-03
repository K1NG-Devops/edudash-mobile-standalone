--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Debian 17.5-1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', '77ebd134-e616-4011-bcf2-ccbe9751912a', 'authenticated', 'authenticated', 'elsha.pp91@gmail.com', '$2a$10$8vwTvvZCElBbrz0TlCbZyedg5huiR/Au5AtgqB4/./zSSSxOBT4xy', '2025-09-01 22:42:05.013487+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-01 22:45:02.77085+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Reeri Anderson", "role": "principal", "preschool_id": "2c37b53d-9092-46a2-955e-6f657368a756", "email_verified": true}', NULL, '2025-09-01 22:42:04.972443+00', '2025-09-01 22:45:02.774704+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', '9bcfef71-5195-4156-89bb-d05eb62009ce', 'authenticated', 'authenticated', 'admin@youngeagles.org.za', '$2a$10$WlBkfkXfbPYtOwJA.2jqB.be3NSOWK0/ggwHjvLkjBG6doG82uydW', '2025-08-30 17:03:33.021973+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-02 17:26:20.853078+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Test Parent", "role": "parent", "preschool_id": "ba79097c-1b93-4b48-bcbe-df73878ab4d1", "email_verified": true}', NULL, '2025-08-30 17:03:32.990693+00', '2025-09-03 09:04:55.168581+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', '136cf31c-b37c-45c0-9cf7-755bd1b9afbf', 'authenticated', 'authenticated', 'elsha@youngeagles.org.za', '$2a$10$8d66iTmcYMKyRivOtTHiZeqxncTSmSmxPGoFYbHEx49tYYpbCoD8u', '2025-08-25 16:08:27.340871+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-02 00:20:50.612536+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Precious Makunyane", "role": "principal", "preschool_id": "ba79097c-1b93-4b48-bcbe-df73878ab4d1", "email_verified": true}', NULL, '2025-08-25 16:08:27.310326+00', '2025-09-03 13:19:43.024408+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', 'a1fd12d2-5f09-4a23-822d-f3071bfc544b', 'authenticated', 'authenticated', 'katso@youngeagles.org.za', '$2a$10$VtF/idHFsTPxwceC7uGXruvTCWcQIah9JsI.k/k3VNJUOS/5f9U3m', '2025-08-26 11:57:03.309704+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-03 13:39:22.410885+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Dimakatso Mogashoa", "role": "teacher", "preschool_id": "ba79097c-1b93-4b48-bcbe-df73878ab4d1", "email_verified": true}', NULL, '2025-08-26 11:57:03.259534+00', '2025-09-03 13:39:22.419827+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', 'd2df36d4-74bc-4ffb-883b-036754764265', 'authenticated', 'authenticated', 'superadmin@edudashpro.org.za', '$2a$06$ZHU.SeSSEFYGAz.6k33LZe9KxPoVEtkIt0WgTIU.kb62sM.LfZCtK', '2025-08-25 10:41:08.834858+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-09-02 00:42:18.38435+00', '{"provider": "email", "providers": ["email"]}', '{"role": "superadmin", "email_verified": true}', NULL, '2025-08-25 10:41:08.819516+00', '2025-09-02 12:47:26.50541+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', 'a661cc72-98ae-4256-973f-4e476cd9f33d', 'authenticated', 'authenticated', 'king@youngeagles.org.za', '$2a$10$j1suM1AuYSR26r/cS.9LtuD9gXFCpTwSbVyMDGuzWxH6R3aEWhnHe', '2025-08-27 12:27:10.45949+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-08-27 12:29:39.440125+00', '{"provider": "email", "providers": ["email"]}', '{"name": "Marrion Makunyane", "role": "teacher", "preschool_id": "ba79097c-1b93-4b48-bcbe-df73878ab4d1", "email_verified": true}', NULL, '2025-08-27 12:27:10.427671+00', '2025-08-27 12:29:39.444039+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) VALUES ('00000000-0000-0000-0000-000000000000', 'b345de36-e132-4ce2-b3b5-32e7a2cf6558', 'authenticated', 'authenticated', 'zanele@edudashpro.org.za', '$2a$10$qPJSU7nbFhGUg6DYPoJMQuLKMJ38GAI6GzjvIOpqHPc/5FINB7u8a', NULL, NULL, '6d95fd97d4225bc315cf294e5567c5dbd7c852a255f59d9d5da80312', '2025-08-26 23:16:43.649534+00', '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"sub": "b345de36-e132-4ce2-b3b5-32e7a2cf6558", "name": "Zanele Maks", "role": "teacher", "email": "zanele@edudashpro.org.za", "email_verified": false, "phone_verified": false}', NULL, '2025-08-26 23:16:43.590961+00', '2025-08-26 23:16:46.968804+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: lesson_categories; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.subscription_plans (id, name, price_monthly, price_annual, features, ai_quota_monthly, max_students, max_teachers, is_active, created_at, tier, currency, updated_at) VALUES ('11111111-1111-4111-8111-111111111111', 'Free Tier', 0.00, 0.00, '["Basic lessons", "Up to 3 students", "Parent-teacher messaging", "Mobile app access", "Ads on non-learning pages"]', 0, 3, 1, true, '2025-08-26 08:22:45.478747+00', 'free', 'ZAR', '2025-08-26 09:54:10.222349+00');
INSERT INTO public.subscription_plans (id, name, price_monthly, price_annual, features, ai_quota_monthly, max_students, max_teachers, is_active, created_at, tier, currency, updated_at) VALUES ('22222222-2222-4222-8222-222222222222', 'Neural Starter', 49.00, 488.04, '["5 AI lessons per day", "Up to 15 students", "Advanced progress tracking", "Parent-teacher messaging", "No ads"]', 150, 15, 3, true, '2025-08-26 08:22:45.478747+00', 'free', 'ZAR', '2025-08-26 09:54:10.222349+00');
INSERT INTO public.subscription_plans (id, name, price_monthly, price_annual, features, ai_quota_monthly, max_students, max_teachers, is_active, created_at, tier, currency, updated_at) VALUES ('33333333-3333-4333-8333-333333333333', 'Quantum Pro', 299.00, 2978.04, '["Unlimited AI lesson generation", "Up to 50 students", "Advanced analytics & insights", "AI homework grading", "Custom school branding"]', NULL, 50, NULL, true, '2025-08-26 08:22:45.478747+00', 'free', 'ZAR', '2025-08-26 09:54:10.222349+00');
INSERT INTO public.subscription_plans (id, name, price_monthly, price_annual, features, ai_quota_monthly, max_students, max_teachers, is_active, created_at, tier, currency, updated_at) VALUES ('44444444-4444-4444-8444-444444444444', 'Singularity', 999.00, 9950.04, '["Unlimited everything", "Multi-school management", "Advanced AI tutoring", "Predictive analytics", "Enterprise security"]', NULL, NULL, NULL, true, '2025-08-26 08:22:45.478747+00', 'free', 'ZAR', '2025-08-26 09:54:10.222349+00');


--
-- Data for Name: preschools; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.preschools (id, name, registration_number, address, phone, email, subscription_tier, is_active, created_at, updated_at, subscription_plan_id, onboarding_status, tenant_slug, subscription_plan, subscription_status, setup_completed, max_students, max_teachers, billing_email, subscription_start_date, subscription_end_date, domain, timezone, logo_url, payfast_token) VALUES ('ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'Young Eagles', NULL, '7118 Section U Shabangu Street Mamelodi Pretoria 0122', '+27670614747', 'elsha@youngeagles.org.za', 'basic', true, '2025-08-25 16:08:26.94+00', '2025-08-26 17:29:40.639229+00', NULL, 'completed', 'young-eagles', 'trial', 'active', true, 50, 10, 'elsha@youngeagles.org.za', NULL, NULL, NULL, 'UTC', NULL, NULL);
INSERT INTO public.preschools (id, name, registration_number, address, phone, email, subscription_tier, is_active, created_at, updated_at, subscription_plan_id, onboarding_status, tenant_slug, subscription_plan, subscription_status, setup_completed, max_students, max_teachers, billing_email, subscription_start_date, subscription_end_date, domain, timezone, logo_url, payfast_token) VALUES ('2c37b53d-9092-46a2-955e-6f657368a756', 'Fringe', NULL, '123 green street', '+27670614747', 'elsha.pp91@gmail.com', 'basic', true, '2025-09-01 22:42:04.792+00', '2025-09-01 22:42:04.781708+00', NULL, 'completed', 'fringe', 'trial', 'active', true, 50, 10, 'elsha.pp91@gmail.com', NULL, NULL, NULL, 'UTC', NULL, NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('3bd86a31-7e78-4075-9d01-9e7606723dea', '136cf31c-b37c-45c0-9cf7-755bd1b9afbf', 'elsha@youngeagles.org.za', 'Precious Makunyane', 'principal', NULL, true, 'incomplete', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '2025-08-25 16:08:27.309991+00', '2025-08-25 16:08:27.766491+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'free', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('48f8086a-3c88-44a2-adcd-570d97d3a580', 'a1fd12d2-5f09-4a23-822d-f3071bfc544b', 'katso@youngeagles.org.za', 'Dimakatso Mogashoa', 'teacher', NULL, true, 'incomplete', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '2025-08-26 11:57:03.259179+00', '2025-08-26 11:57:04.292707+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'free', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('d0b2ab3a-4c60-4534-aaaf-5a67caa3b8ce', 'd2df36d4-74bc-4ffb-883b-036754764265', 'superadmin@edudashpro.org.za', 'EduDash Super Administrator', 'superadmin', NULL, true, 'complete', NULL, '2025-08-25 10:41:08.817746+00', '2025-08-26 17:29:41.350043+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'enterprise', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('bc427a5b-82b3-43dd-b095-0561b2ce8ee0', 'b345de36-e132-4ce2-b3b5-32e7a2cf6558', 'zanele@edudashpro.org.za', 'Zanele Maks', 'teacher', NULL, true, 'incomplete', NULL, '2025-08-26 23:16:43.589525+00', '2025-08-26 23:16:43.589525+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'free', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('19583dad-a4ee-42f1-8354-5e80bf090031', 'a661cc72-98ae-4256-973f-4e476cd9f33d', 'king@youngeagles.org.za', 'Marrion Makunyane', 'teacher', NULL, true, 'incomplete', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '2025-08-27 12:27:10.427314+00', '2025-08-27 12:27:11.431044+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'free', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('32cce26f-c10f-4af4-8fb4-f77010755a1a', '9bcfef71-5195-4156-89bb-d05eb62009ce', 'admin@youngeagles.org.za', 'Test Parent', 'parent', NULL, true, 'incomplete', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '2025-08-30 17:03:32.988979+00', '2025-08-30 17:03:33.401035+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'free', 'active', NULL, NULL, NULL);
INSERT INTO public.users (id, auth_user_id, email, name, role, phone, is_active, profile_completion_status, preschool_id, created_at, updated_at, date_of_birth, gender, nationality, id_number, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship, street_address, city, state_province, postal_code, country, employee_id, department, position_title, employment_start_date, employment_status, salary_amount, salary_currency, highest_qualification, institution_name, qualification_year, certifications, teaching_experience_years, subjects_taught, age_groups_taught, biography, languages_spoken, profile_picture_url, notes, documents, availability, password_reset_required, subscription_tier, subscription_status, subscription_start_date, subscription_plan_id, avatar_url) VALUES ('3884c8fd-ea74-43cd-bce6-6d0fbcd24110', '77ebd134-e616-4011-bcf2-ccbe9751912a', 'elsha.pp91@gmail.com', 'Reeri Anderson', 'principal', NULL, true, 'incomplete', '2c37b53d-9092-46a2-955e-6f657368a756', '2025-09-01 22:42:04.971578+00', '2025-09-01 22:42:05.170403+00', NULL, NULL, 'South African', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'South Africa', NULL, NULL, NULL, NULL, 'full_time', NULL, 'ZAR', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, '{English}', NULL, NULL, '{}', '{}', false, 'free', 'active', NULL, NULL, NULL);


--
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: activity_feed; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.activity_feed (id, actor_id, action, target_type, target_id, preschool_id, metadata, visibility, created_at) VALUES ('bac1d4cd-c2b4-4e6a-a785-017f8a711e36', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'joined_event', 'event', '69c99f2f-1f2a-4820-a17b-d01595a51b54', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '{"event_title": "hjkjkkj", "participation_type": "attendee"}', 'public', '2025-08-31 18:26:04.154828+00');
INSERT INTO public.activity_feed (id, actor_id, action, target_type, target_id, preschool_id, metadata, visibility, created_at) VALUES ('eac5ba29-b8b9-4cb7-8b20-6ba664e023ce', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'joined_event', 'event', '7dc8a0cd-d17f-44de-8c7a-e9a90e1a9ca2', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '{"event_title": "Hartebeespoort dam", "participation_type": "attendee"}', 'public', '2025-09-02 11:39:10.922813+00');


--
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: age_groups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: billing_invoices; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.classes (id, name, age_group, preschool_id, teacher_id, capacity, is_active, created_at, updated_at, room_number, current_enrollment, max_capacity, age_min, age_max, age_group_id) VALUES ('83913891-d269-416f-8ff3-e2476a538bc4', 'Panda', NULL, 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '48f8086a-3c88-44a2-adcd-570d97d3a580', 20, true, '2025-08-27 10:10:26.167+00', '2025-08-27 10:10:25.693974+00', '1', 0, 30, NULL, NULL, NULL);


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.events (id, preschool_id, title, description, event_type, start_date, end_date, location, created_by, is_published, created_at, updated_at, status, max_participants, cover_image_url, is_featured, tags, metadata, audience_type, audience_config, requires_approval, auto_accept_roles, visibility, current_participants) VALUES ('69c99f2f-1f2a-4820-a17b-d01595a51b54', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'hjkjkkj', NULL, 'field_trip', '2025-09-01 17:52:00+00', NULL, NULL, '3bd86a31-7e78-4075-9d01-9e7606723dea', false, '2025-08-31 17:54:14.112372+00', '2025-08-31 17:54:14.112372+00', 'upcoming', NULL, NULL, false, '{}', '{}', 'everyone', '{}', false, '{}', 'public', 0);
INSERT INTO public.events (id, preschool_id, title, description, event_type, start_date, end_date, location, created_by, is_published, created_at, updated_at, status, max_participants, cover_image_url, is_featured, tags, metadata, audience_type, audience_config, requires_approval, auto_accept_roles, visibility, current_participants) VALUES ('7dc8a0cd-d17f-44de-8c7a-e9a90e1a9ca2', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'Hartebeespoort dam', 'Summer time', 'field_trip', '2025-10-01 22:04:00+00', NULL, NULL, '3bd86a31-7e78-4075-9d01-9e7606723dea', false, '2025-09-01 22:08:03.044283+00', '2025-09-01 22:08:03.044283+00', 'upcoming', NULL, NULL, false, '{}', '{"targeting": {"visibility": "public", "audience_type": "everyone", "audience_config": {"user_ids": [], "group_ids": [], "role_filters": [], "custom_criteria": {}}, "auto_accept_roles": ["principal"], "requires_approval": false}, "visibility": "public", "requires_approval": false}', 'everyone', '{}', false, '{}', 'public', 0);


--
-- Data for Name: event_audiences; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: event_invitations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: event_updates; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: event_media; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: event_notifications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.students (id, first_name, last_name, date_of_birth, preschool_id, class_id, parent_id, is_active, created_at, updated_at, age_group_id, enrollment_date, gender, medical_conditions, allergies, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, avatar_url) VALUES ('cc7e4eb1-7e7c-4af7-94d2-f1e719616967', 'Olivia', 'Makunyane', '2019-01-06', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', NULL, '32cce26f-c10f-4af4-8fb4-f77010755a1a', true, '2025-08-30 17:04:28.765126+00', '2025-08-30 17:04:28.765126+00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: event_participants; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.event_participants (id, event_id, user_id, student_id, participation_type, status, registered_at, checked_in_at, checked_out_at, notes, metadata, created_at, updated_at) VALUES ('fd1dc982-915b-4601-9202-98c6bfc0c8a6', '69c99f2f-1f2a-4820-a17b-d01595a51b54', '32cce26f-c10f-4af4-8fb4-f77010755a1a', NULL, 'attendee', 'registered', '2025-08-31 18:26:03.773198+00', NULL, NULL, NULL, '{}', '2025-08-31 18:26:03.773198+00', '2025-08-31 18:26:03.773198+00');
INSERT INTO public.event_participants (id, event_id, user_id, student_id, participation_type, status, registered_at, checked_in_at, checked_out_at, notes, metadata, created_at, updated_at) VALUES ('dce78de8-0528-413f-b4cb-81aca204fd6c', '7dc8a0cd-d17f-44de-8c7a-e9a90e1a9ca2', '32cce26f-c10f-4af4-8fb4-f77010755a1a', NULL, 'attendee', 'registered', '2025-09-02 11:39:10.35705+00', NULL, NULL, NULL, '{}', '2025-09-02 11:39:10.35705+00', '2025-09-02 11:39:10.35705+00');


--
-- Data for Name: event_reactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: principal_groups; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: group_invitations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: media_uploads; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: message_drafts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.message_drafts (id, sender_id, subject, content, recipient_ids, created_at, updated_at) VALUES ('d7e52e32-cc99-44fc-a976-069375a5e316', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '', 'So', '{48f8086a-3c88-44a2-adcd-570d97d3a580}', '2025-09-02 10:08:14.643375+00', '2025-09-02 10:08:14.643375+00');
INSERT INTO public.message_drafts (id, sender_id, subject, content, recipient_ids, created_at, updated_at) VALUES ('9ff55ec7-50ee-4dc2-9804-0ceeb12cfbb8', '3bd86a31-7e78-4075-9d01-9e7606723dea', '', 'Jdjdndbd', '{32cce26f-c10f-4af4-8fb4-f77010755a1a}', '2025-09-01 22:03:15.316462+00', '2025-09-01 22:03:15.316462+00');
INSERT INTO public.message_drafts (id, sender_id, subject, content, recipient_ids, created_at, updated_at) VALUES ('b205315f-7d4c-4fc8-bbe0-c034a7f0d013', '3bd86a31-7e78-4075-9d01-9e7606723dea', '', 'hHFgMNhsfdUKUEkA', '{19583dad-a4ee-42f1-8354-5e80bf090031}', '2025-08-28 07:28:18.193521+00', '2025-08-28 07:28:18.193521+00');


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('7267d2cc-4cd6-4d7d-8b06-41a7fdb64759', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'This is a direct message', 'direct', 'normal', '2025-08-28 12:39:09.933149+00', '2025-08-28 12:39:09.933149+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('bc74140d-6d67-4317-9e16-2a79ffecbec8', '48f8086a-3c88-44a2-adcd-570d97d3a580', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello teacher', 'direct', 'normal', '2025-08-28 16:16:32.431626+00', '2025-08-28 16:16:32.431626+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('0a37669b-61b0-484e-b4e1-c9e811158499', '48f8086a-3c88-44a2-adcd-570d97d3a580', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello teacher', 'direct', 'normal', '2025-08-28 16:51:00.773114+00', '2025-08-28 16:51:00.773114+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('98f2de5a-9e97-4e90-a113-cfeca3213b4e', '48f8086a-3c88-44a2-adcd-570d97d3a580', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello teacher', 'direct', 'normal', '2025-08-28 16:56:19.944592+00', '2025-08-28 16:56:19.944592+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('f0cdb531-8bf2-4abc-995e-ec8bf5096b36', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello', 'direct', 'normal', '2025-08-28 16:57:06.005847+00', '2025-08-28 16:57:06.005847+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('600fa037-b413-42fd-ad70-66debf089d95', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'GPT5', 'direct', 'normal', '2025-08-30 16:48:42.838389+00', '2025-08-30 16:48:42.838389+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('49b82895-835e-49d3-b8eb-3544b845bb7c', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Second Test - working', 'direct', 'normal', '2025-08-30 16:55:00.623143+00', '2025-08-30 16:55:00.623143+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('ab158abf-9979-4f76-a89c-c67e62d05c14', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello mama', 'direct', 'normal', '2025-08-30 17:18:47.181743+00', '2025-08-30 17:18:47.181743+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('a661af6a-1dc5-496b-8120-fb800ecab33a', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'hi', 'direct', 'normal', '2025-08-30 17:19:19.231872+00', '2025-08-30 17:19:19.231872+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('79546f34-738a-4184-9441-81a0a0a72942', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello principal', 'direct', 'normal', '2025-08-30 18:13:20.861637+00', '2025-08-30 18:13:20.861637+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('86cc0ee1-44a0-4ebd-a149-43101b2fcf0d', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hi teacher', 'direct', 'normal', '2025-08-30 18:41:04.179715+00', '2025-08-30 18:41:04.179715+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('153c5324-4967-47fd-8409-c2097a47b27c', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'hello teacher', 'direct', 'normal', '2025-08-30 18:44:06.140981+00', '2025-08-30 18:44:06.140981+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('b3211875-9363-48f7-b1e9-be96e1925872', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'It''s Olivia''s father', 'direct', 'normal', '2025-08-30 18:44:55.657091+00', '2025-08-30 18:44:55.657091+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('1821ba01-cfdd-4ca0-b241-06819caff6a8', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello', 'direct', 'normal', '2025-08-30 18:46:34.834109+00', '2025-08-30 18:46:34.834109+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('ecee5909-5af6-41a0-9d52-d3d22a52f9c2', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Teacher', 'direct', 'normal', '2025-08-30 18:49:48.267158+00', '2025-08-30 18:49:48.267158+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('1118d3c3-d528-4c64-91a2-f7077a470f20', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'How are you', 'direct', 'normal', '2025-08-30 18:50:21.934737+00', '2025-08-30 18:50:21.934737+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('33958c85-bbb5-4b53-859d-3ffb2c07cb37', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'You did not make payment for Olivia this month', 'direct', 'normal', '2025-08-30 18:53:46.636128+00', '2025-08-30 18:53:46.636128+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('6e6c6614-1383-47b6-a656-03b7b1acc36f', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hi', 'direct', 'normal', '2025-08-30 19:01:30.733027+00', '2025-08-30 19:01:30.733027+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('e8194726-f087-4898-a3f9-efedb42cc78e', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'This is not working', 'direct', 'normal', '2025-08-30 19:07:58.599124+00', '2025-08-30 19:07:58.599124+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('427c0e8c-4f1d-493e-b23c-5eb61f39ec3f', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Mam', 'direct', 'normal', '2025-08-30 19:48:03.646753+00', '2025-08-30 19:48:03.646753+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('8d73f468-828e-4ca8-91ff-93f5c37c609d', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Morning teacher', 'direct', 'normal', '2025-08-30 20:38:50.899838+00', '2025-08-30 20:38:50.899838+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('40d14a62-fb44-41e4-9c0a-a6b2ddf80d09', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Please check your invoice', 'direct', 'normal', '2025-08-30 21:41:56.962892+00', '2025-08-30 21:41:56.962892+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('ed205e08-0e33-4654-a8dc-697a08251299', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'And Olivia has done great in her last assignment', 'direct', 'normal', '2025-08-30 21:45:19.250536+00', '2025-08-30 21:45:19.250536+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('07d045ab-1fc3-4ed9-9e3b-908f29f5ade2', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'There is a parent meeting on Friday', 'direct', 'normal', '2025-08-30 21:46:51.053544+00', '2025-08-30 21:46:51.053544+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('feb81490-00eb-43a5-914d-735ed3134846', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Ok mam', 'direct', 'normal', '2025-08-30 21:53:39.513229+00', '2025-08-30 21:53:39.513229+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('9dc2513b-ea78-4a1f-b191-cad83f8240dd', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Testing whatsapp like style UI', 'direct', 'normal', '2025-08-30 23:16:06.847424+00', '2025-08-30 23:16:06.847424+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('7f9348ca-1932-49f6-8907-b9e061f13aa2', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'When are you coming', 'direct', 'normal', '2025-08-31 00:00:45.718451+00', '2025-08-31 00:00:45.718451+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('4206f6b3-8e0b-4901-9b6b-09b4c3cbb890', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'I will come tomorrow', 'direct', 'normal', '2025-08-31 00:26:03.227974+00', '2025-08-31 00:26:03.227974+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('34fadc1d-3a54-4018-9b8b-05b530aad663', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Olivia left her jacket', 'direct', 'normal', '2025-08-31 02:11:50.424258+00', '2025-08-31 02:11:50.424258+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('a38f2979-9030-4453-8f45-d46cf691904a', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Morning teacher', 'direct', 'normal', '2025-08-31 02:12:40.779784+00', '2025-08-31 02:12:40.779784+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('1d9818b5-e295-4f26-8952-a62c64a1949d', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Happy sunday', 'direct', 'normal', '2025-08-31 07:06:18.228726+00', '2025-08-31 07:06:18.228726+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('031f8bd1-6c77-4eb3-82dc-7e60d3725c00', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Happy sunday to you too', 'direct', 'normal', '2025-08-31 07:07:15.130151+00', '2025-08-31 07:07:15.130151+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('4d82a17c-10cf-41df-a23a-056d27ad4bfd', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Have a blessed one', 'direct', 'normal', '2025-08-31 07:11:43.809871+00', '2025-08-31 07:11:43.809871+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('43e15d87-285e-4ea7-8a6d-bf15d7a10a4d', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Thanks', 'direct', 'normal', '2025-08-31 07:15:35.727568+00', '2025-08-31 07:15:35.727568+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('6b42b466-3227-4978-8716-6f743fe67a0d', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'This branch is working', 'direct', 'normal', '2025-08-31 08:55:56.900936+00', '2025-08-31 08:55:56.900936+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('1661905b-7f23-48be-a9fb-61ba6004ede8', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'hello', 'direct', 'normal', '2025-08-31 09:18:43.242437+00', '2025-08-31 09:18:43.242437+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('b9e5ad9a-bab0-4f34-b3af-164512ab5909', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Welldone!', 'direct', 'normal', '2025-08-31 09:26:18.953107+00', '2025-08-31 09:26:18.953107+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('312a8226-101b-43fd-b904-64c18e099886', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'I am impressed', 'direct', 'normal', '2025-08-31 09:26:50.761855+00', '2025-08-31 09:26:50.761855+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('b491a47e-927b-4ea2-8eb8-0d894363d73e', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'The full page reload issue has been solved', 'direct', 'normal', '2025-08-31 09:33:51.652464+00', '2025-08-31 09:33:51.652464+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('9948ddc2-dd83-43d4-86f6-c7d9660b4ea2', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Sorry had to restart the server', 'direct', 'normal', '2025-08-31 09:34:19.625561+00', '2025-08-31 09:34:19.625561+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('b41e6b7a-7b2d-49c5-9ad4-94d9b540d652', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Still not working', 'direct', 'normal', '2025-08-31 09:35:47.31359+00', '2025-08-31 09:35:47.31359+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('23bd2563-f3ba-42d5-b917-c24fe292afa9', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Let me test on my side', 'direct', 'normal', '2025-08-31 09:41:50.978654+00', '2025-08-31 09:41:50.978654+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('b3f209a2-c37e-497a-9b10-170f643356b9', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Ok testing again myself', 'direct', 'normal', '2025-08-31 09:45:23.239467+00', '2025-08-31 09:45:23.239467+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('0d2fd18e-ab38-43f2-9c18-5dd4b2ed4ae7', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'Test', 'Testing', 'announcement', 'normal', '2025-08-31 11:33:28.670753+00', '2025-08-31 11:33:28.670753+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('3a3070dc-96bf-4bc6-a2a1-656ea479458b', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'Second Announcement', 'Testing2', 'announcement', 'normal', '2025-08-31 11:59:38.796071+00', '2025-08-31 11:59:38.796071+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('0b1c0893-fb6d-4557-a0e3-eacec9a9e46d', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'Badge', 'Now notifications are showing in the Announcement Tab', 'announcement', 'normal', '2025-08-31 12:11:23.524945+00', '2025-08-31 12:11:23.524945+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('36ac1d87-2ca0-4bf3-8d88-98dd992fc0ce', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'Excursion', 'Please finalize your payments for the upcoming Excursion', 'announcement', 'normal', '2025-08-31 15:11:57.757783+00', '2025-08-31 15:11:57.757783+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('e41e1ca3-aea1-4423-a7fd-86392ab7b11c', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hi', 'direct', 'normal', '2025-09-01 21:16:11.748895+00', '2025-09-01 21:16:11.748895+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('ce3afb9b-b324-4488-b317-014e07b7accb', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello Mam your child was fighting today in class...', 'direct', 'normal', '2025-09-01 21:59:39.980868+00', '2025-09-01 21:59:39.980868+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('d5af9f9b-b85d-4ecf-bfde-cd26561cec68', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Morning', 'direct', 'normal', '2025-09-01 22:03:40.164813+00', '2025-09-01 22:03:40.164813+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('b472006e-4ff4-4ead-b251-3637e4f958a9', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hello Principal', 'direct', 'normal', '2025-09-02 07:14:31.276893+00', '2025-09-02 07:14:31.276893+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('e5a89064-2895-40b9-8ce9-f92e7b522e83', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Hi', 'direct', 'normal', '2025-09-02 09:26:42.818649+00', '2025-09-02 09:26:42.818649+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('5dccd88a-fa66-418a-89b6-dfeacad7eab8', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Yebo...', 'direct', 'normal', '2025-09-02 10:00:40.856314+00', '2025-09-02 10:00:40.856314+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('1094eb00-98fb-4414-8295-5441c603cde7', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'hello dear', 'direct', 'normal', '2025-09-02 13:35:48.236342+00', '2025-09-02 13:35:48.236342+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('1e4a45d9-a434-4f46-9959-319c6743b7d0', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'testing enter', 'direct', 'normal', '2025-09-02 14:29:34.605411+00', '2025-09-02 14:29:34.605411+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('09e89872-2ed5-4b6b-87f5-8384a8b7bae0', '3bd86a31-7e78-4075-9d01-9e7606723dea', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'is working', 'direct', 'normal', '2025-09-02 15:29:58.360713+00', '2025-09-02 15:29:58.360713+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('c5ee4014-ecfc-477f-b845-ea502db35fa5', '48f8086a-3c88-44a2-adcd-570d97d3a580', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'hello', 'direct', 'normal', '2025-09-02 16:22:06.115385+00', '2025-09-02 16:22:06.115385+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);
INSERT INTO public.messages (id, sender_id, preschool_id, subject, content, message_type, priority, sent_at, created_at, preview, is_read, conversation_id, receiver_id, sender_type, receiver_type, deleted_at) VALUES ('707e1cca-0468-4572-aa5e-6be039001233', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', '', 'Good and you...', 'direct', 'normal', '2025-09-02 16:24:00.866081+00', '2025-09-02 16:24:00.866081+00', NULL, false, NULL, NULL, 'user', 'direct', NULL);


--
-- Data for Name: message_recipients; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('f5d808d8-9676-4d82-b076-918108bdfb58', 'ab158abf-9979-4f76-a89c-c67e62d05c14', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-30 18:41:05.784+00', NULL, '2025-08-30 17:18:47.181743+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('c29ffbd5-e76c-4b48-8ccc-26b8b98d739e', '79546f34-738a-4184-9441-81a0a0a72942', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-30 18:50:09.405+00', NULL, '2025-08-30 18:13:20.861637+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('002cee7d-185e-4429-b6f8-0e5806264dce', '1118d3c3-d528-4c64-91a2-f7077a470f20', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-30 19:01:32.747+00', NULL, '2025-08-30 18:50:21.934737+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('57bbc3bd-1cc9-43f8-b05d-5c5c6b0b47a7', '33958c85-bbb5-4b53-859d-3ffb2c07cb37', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-30 19:01:32.747+00', NULL, '2025-08-30 18:53:46.636128+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('4a22215c-4f08-45a9-9ae7-8ed31d699a56', 'e8194726-f087-4898-a3f9-efedb42cc78e', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-30 19:13:24.698+00', NULL, '2025-08-30 19:07:58.599124+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('fb2dfd7c-6d8d-47c1-ba24-151d59dc7ae3', '427c0e8c-4f1d-493e-b23c-5eb61f39ec3f', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-30 20:06:50.756+00', NULL, '2025-08-30 19:48:03.646753+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('b69ceae6-77df-4928-a4e0-1fbd6aad6613', '8d73f468-828e-4ca8-91ff-93f5c37c609d', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-30 21:41:32.318+00', NULL, '2025-08-30 20:38:50.899838+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('6cb1c246-09c7-4d63-a2b4-9727f771e287', '40d14a62-fb44-41e4-9c0a-a6b2ddf80d09', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-30 21:43:50.442+00', NULL, '2025-08-30 21:41:56.962892+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('44559df6-e90b-4835-a6a2-03b00c325b44', 'ed205e08-0e33-4654-a8dc-697a08251299', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-30 21:49:53.964+00', NULL, '2025-08-30 21:45:19.250536+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('430d921a-bfcb-4c03-8d88-70872660c52a', '07d045ab-1fc3-4ed9-9e3b-908f29f5ade2', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-30 21:49:53.964+00', NULL, '2025-08-30 21:46:51.053544+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('26439b78-a9a4-4be7-95e4-02e1d916128c', 'feb81490-00eb-43a5-914d-735ed3134846', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-30 22:13:32.007+00', NULL, '2025-08-30 21:53:39.513229+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('3a98cf27-b1a4-47d7-9e33-433a1d8b1c26', '4206f6b3-8e0b-4901-9b6b-09b4c3cbb890', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 00:48:37.874+00', NULL, '2025-08-31 00:26:03.227974+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('5dd56caf-3851-4602-a92b-36019e33163c', '9dc2513b-ea78-4a1f-b191-cad83f8240dd', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 02:11:23.582+00', NULL, '2025-08-30 23:16:06.847424+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('13751e42-0f67-40ce-96fb-c113265984e0', '7f9348ca-1932-49f6-8907-b9e061f13aa2', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 02:11:23.582+00', NULL, '2025-08-31 00:00:45.718451+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('3a746926-04c2-4b80-9656-f459c0828be2', '34fadc1d-3a54-4018-9b8b-05b530aad663', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 07:06:56.883+00', NULL, '2025-08-31 02:11:50.424258+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('8d39e6c7-f364-4bf4-9340-29de4b3c31b3', '1d9818b5-e295-4f26-8952-a62c64a1949d', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 07:06:56.883+00', NULL, '2025-08-31 07:06:18.228726+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('4621de22-9e6d-4d8f-a651-31c7ab7e6cb6', '031f8bd1-6c77-4eb3-82dc-7e60d3725c00', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 07:15:12.706+00', NULL, '2025-08-31 07:07:15.130151+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('d4324e59-ba52-4e84-a37f-6273520362e0', '4d82a17c-10cf-41df-a23a-056d27ad4bfd', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 07:15:12.706+00', NULL, '2025-08-31 07:11:43.809871+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('311a6551-873a-499d-b6d1-922f9d076702', '43e15d87-285e-4ea7-8a6d-bf15d7a10a4d', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 08:55:06.496+00', NULL, '2025-08-31 07:15:35.727568+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('2e2fd468-8395-49c0-822a-5e07370f25ec', '6b42b466-3227-4978-8716-6f743fe67a0d', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 08:56:47.394+00', NULL, '2025-08-31 08:55:56.900936+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('31d22665-e0d6-45ae-afb1-e1c88c6bbbee', 'b9e5ad9a-bab0-4f34-b3af-164512ab5909', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 09:41:35.811+00', NULL, '2025-08-31 09:26:18.953107+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('1b589083-5a50-42d0-93f6-a3614eafd477', '312a8226-101b-43fd-b904-64c18e099886', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 09:41:35.811+00', NULL, '2025-08-31 09:26:50.761855+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('10ca5a0e-879e-45a2-8148-c960f7ae5ccc', 'b491a47e-927b-4ea2-8eb8-0d894363d73e', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 09:41:35.811+00', NULL, '2025-08-31 09:33:51.652464+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('cff20c41-e46f-4099-b5bf-6102511219f2', '9948ddc2-dd83-43d4-86f6-c7d9660b4ea2', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 09:41:35.811+00', NULL, '2025-08-31 09:34:19.625561+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('49a9bd81-0d76-4f0c-8397-d2f55ee3e5d4', 'b41e6b7a-7b2d-49c5-9ad4-94d9b540d652', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 09:41:35.811+00', NULL, '2025-08-31 09:35:47.31359+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('0a90ba1c-fa09-4378-b192-efa71d1e5bea', '23bd2563-f3ba-42d5-b917-c24fe292afa9', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 09:45:06.905+00', NULL, '2025-08-31 09:41:50.978654+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('f7ea18bd-530c-461a-9477-8a84a5254c78', 'b3f209a2-c37e-497a-9b10-170f643356b9', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 09:45:39.902+00', NULL, '2025-08-31 09:45:23.239467+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('07d42ca3-6dbc-4d69-b061-97eb5bd7c961', '0d2fd18e-ab38-43f2-9c18-5dd4b2ed4ae7', '19583dad-a4ee-42f1-8354-5e80bf090031', NULL, NULL, '2025-08-31 11:33:28.670753+00', false, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('97d42ba8-12ac-43c5-b1c6-bf0cc2d7f01e', '0d2fd18e-ab38-43f2-9c18-5dd4b2ed4ae7', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 11:34:38.145+00', NULL, '2025-08-31 11:33:28.670753+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('9bfdc63b-02a5-48d6-8243-196bb9929f21', '3a3070dc-96bf-4bc6-a2a1-656ea479458b', '19583dad-a4ee-42f1-8354-5e80bf090031', NULL, NULL, '2025-08-31 11:59:38.796071+00', false, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('8ee3af9c-4910-456e-8397-f6f5a487b1ff', '0b1c0893-fb6d-4557-a0e3-eacec9a9e46d', '19583dad-a4ee-42f1-8354-5e80bf090031', NULL, NULL, '2025-08-31 12:11:23.524945+00', false, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('3ef5a424-a35c-41f1-9e78-8a3a10cc4fee', '3a3070dc-96bf-4bc6-a2a1-656ea479458b', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 12:12:06.857+00', NULL, '2025-08-31 11:59:38.796071+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('dfa0d461-80a0-4103-8f27-1f3f5d9f4ab1', '0b1c0893-fb6d-4557-a0e3-eacec9a9e46d', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 12:12:06.857+00', NULL, '2025-08-31 12:11:23.524945+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('752c510c-00be-418b-8801-d19cd37f750b', '0d2fd18e-ab38-43f2-9c18-5dd4b2ed4ae7', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 12:23:59.249+00', NULL, '2025-08-31 11:33:28.670753+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('24e123ea-0164-4f2b-bb72-5a1a84be602b', '3a3070dc-96bf-4bc6-a2a1-656ea479458b', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 12:23:59.249+00', NULL, '2025-08-31 11:59:38.796071+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('ccb44666-5fce-409a-a3f6-30429edd4680', '0b1c0893-fb6d-4557-a0e3-eacec9a9e46d', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 12:23:59.249+00', NULL, '2025-08-31 12:11:23.524945+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('8dd2663b-cb0f-4ed0-846b-488e613bf0e3', '36ac1d87-2ca0-4bf3-8d88-98dd992fc0ce', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-08-31 15:12:16.269+00', NULL, '2025-08-31 15:11:57.757783+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('b1fb3357-6a0e-46a7-9709-84987313759d', '36ac1d87-2ca0-4bf3-8d88-98dd992fc0ce', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-08-31 15:18:52.088+00', NULL, '2025-08-31 15:11:57.757783+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('2e933b7d-6026-4bf3-9bc4-1d7dac9b9c43', 'e41e1ca3-aea1-4423-a7fd-86392ab7b11c', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-09-02 00:29:04.884+00', NULL, '2025-09-01 21:16:11.748895+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('a3084bb9-b586-457f-a38d-bbbffc19892c', 'ce3afb9b-b324-4488-b317-014e07b7accb', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-09-02 00:29:04.884+00', NULL, '2025-09-01 21:59:39.980868+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('4d7df46e-a2f8-49e4-bc64-e7d6f901dc06', 'd5af9f9b-b85d-4ecf-bfde-cd26561cec68', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-09-02 00:29:04.884+00', NULL, '2025-09-01 22:03:40.164813+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('32db8181-b96d-44e5-95ed-0c08521f30a7', 'b472006e-4ff4-4ead-b251-3637e4f958a9', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-09-02 11:06:34.529+00', NULL, '2025-09-02 07:14:31.276893+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('13c58323-c032-4e01-a243-1a9d8f2bd0d0', '1094eb00-98fb-4414-8295-5441c603cde7', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-09-02 14:09:34.456+00', NULL, '2025-09-02 13:35:48.236342+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('700934c1-abf1-4d94-8796-1ed85fb1db96', '1e4a45d9-a434-4f46-9959-319c6743b7d0', '3bd86a31-7e78-4075-9d01-9e7606723dea', '2025-09-02 15:29:39.041+00', NULL, '2025-09-02 14:29:34.605411+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('aea1b8a0-4acc-4c53-b71b-d9f42b7c0553', '09e89872-2ed5-4b6b-87f5-8384a8b7bae0', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-09-02 15:33:55.331+00', NULL, '2025-09-02 15:29:58.360713+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('a40378fd-8c63-4e25-aa81-c1bef5cd861d', '600fa037-b413-42fd-ad70-66debf089d95', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 16:48:42.838389+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('09c6a0ff-1498-4e8f-92ce-78253a3fc0d5', '49b82895-835e-49d3-b8eb-3544b845bb7c', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 16:55:00.623143+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('e0b46b12-451a-4486-9123-f6268649b2eb', 'a661af6a-1dc5-496b-8120-fb800ecab33a', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 17:19:19.231872+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('0d130534-79d6-4a56-8a21-3617424db00e', '86cc0ee1-44a0-4ebd-a149-43101b2fcf0d', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 18:41:04.179715+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('83946ebe-8f09-42cd-8658-b7470e9e76d9', '153c5324-4967-47fd-8409-c2097a47b27c', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 18:44:06.140981+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('c52f7e27-c756-4716-a5c7-aa6b78b89204', 'b3211875-9363-48f7-b1e9-be96e1925872', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 18:44:55.657091+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('fdf41c01-0fe0-419f-9bfc-2b203cda819a', '1821ba01-cfdd-4ca0-b241-06819caff6a8', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 18:46:34.834109+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('c8d7a0da-1400-4385-ba5f-5e175e490ad7', 'ecee5909-5af6-41a0-9d52-d3d22a52f9c2', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 18:49:48.267158+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('5331d6c4-a561-4d89-89e7-7573fe501f5c', '6e6c6614-1383-47b6-a656-03b7b1acc36f', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-30 19:01:30.733027+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('22b75ce6-f7e2-4038-82df-cd46754d5b01', 'a38f2979-9030-4453-8f45-d46cf691904a', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-31 02:12:40.779784+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('29f93ff1-4447-4b6b-9350-73159c5338a0', '1661905b-7f23-48be-a9fb-61ba6004ede8', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-31 09:18:43.242437+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('e3784030-03cc-4962-a138-c59c7596d10a', '0d2fd18e-ab38-43f2-9c18-5dd4b2ed4ae7', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-31 11:33:28.670753+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('990ec82e-353c-4812-9680-2740855f5d01', '3a3070dc-96bf-4bc6-a2a1-656ea479458b', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-31 11:59:38.796071+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('1205f984-2615-401b-9d30-2fb75225d0fe', '0b1c0893-fb6d-4557-a0e3-eacec9a9e46d', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-08-31 12:11:23.524945+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('17be279f-d1d5-436b-a017-0fd68ad5d3a2', 'e5a89064-2895-40b9-8ce9-f92e7b522e83', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-09-02 09:26:42.818649+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('5dd64f3d-fd93-4bde-aa4e-c5716ff3e6fb', '5dccd88a-fa66-418a-89b6-dfeacad7eab8', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:21:31.326+00', NULL, '2025-09-02 10:00:40.856314+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('1cba2a99-0f18-4632-b260-a4eb867498c3', 'c5ee4014-ecfc-477f-b845-ea502db35fa5', '32cce26f-c10f-4af4-8fb4-f77010755a1a', '2025-09-02 16:23:45.806+00', NULL, '2025-09-02 16:22:06.115385+00', true, false);
INSERT INTO public.message_recipients (id, message_id, recipient_id, read_at, archived_at, created_at, is_read, is_archived) VALUES ('c6926c61-4681-4947-ab57-57031dd748d5', '707e1cca-0468-4572-aa5e-6be039001233', '48f8086a-3c88-44a2-adcd-570d97d3a580', '2025-09-02 16:24:34.535+00', NULL, '2025-09-02 16:24:00.866081+00', true, false);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: parent_access_codes; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payment_transactions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments (id, preschool_id, amount_cents, currency, payment_method, payment_provider, provider_payment_id, status, description, metadata, created_at, updated_at, parent_id, student_id, payment_reference, attachment_url, submitted_at, amount, fee_ids, reviewed_by, reviewed_at, review_notes) VALUES ('2a0ffda8-26e6-4423-a01d-d226102f7adc', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 68000, 'ZAR', 'bank_transfer', NULL, NULL, 'proof_submitted', 'Proof of payment submitted by parent', '{"parent_notes": "", "attachment_name": "Screenshot From 2025-08-30 23-54-42.png", "submission_type": "proof_of_payment", "original_payment_date": "2025-0830"}', '2025-08-30 21:58:29.588709+00', '2025-08-30 21:58:29.588709+00', '32cce26f-c10f-4af4-8fb4-f77010755a1a', 'cc7e4eb1-7e7c-4af7-94d2-f1e719616967', 'EDU-OLIVIA-MAKUNYANE-COEVS', 'proof-of-payments/ba79097c-1b93-4b48-bcbe-df73878ab4d1/32cce26f-c10f-4af4-8fb4-f77010755a1a/1756591107659_afnts2_Screenshot_From_2025-08-30_23-54-42.png', '2025-08-30 21:58:29.375+00', 680.00, '{}', NULL, NULL, NULL);


--
-- Data for Name: school_invitation_codes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.school_invitation_codes (id, code, school_id, invitation_type, invited_email, invited_name, invited_by, max_uses, current_uses, expires_at, is_active, created_at, updated_at, preschool_id, used_at, used_by, description, metadata) VALUES ('51c177ed-8ced-4e1b-b234-af938d37123c', 'ITRLMVEP', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'teacher', 'katso@youngeagles.org.za', NULL, '3bd86a31-7e78-4075-9d01-9e7606723dea', 1, 0, '2025-09-02 11:29:52.344+00', false, '2025-08-26 11:29:52.585276+00', '2025-08-26 11:29:52.585276+00', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', NULL, NULL, 'Teacher invitation', '{"source": "principal_app"}');
INSERT INTO public.school_invitation_codes (id, code, school_id, invitation_type, invited_email, invited_name, invited_by, max_uses, current_uses, expires_at, is_active, created_at, updated_at, preschool_id, used_at, used_by, description, metadata) VALUES ('c3e1922d-3d86-47c0-b043-48530954fff8', 'OBU49LBC', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'teacher', 'king@youngeagles.org.za', NULL, '3bd86a31-7e78-4075-9d01-9e7606723dea', 1, 0, '2025-09-02 12:11:22.724+00', false, '2025-08-26 12:11:24.344751+00', '2025-08-26 12:11:24.344751+00', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', NULL, NULL, 'Teacher invitation', '{"source": "principal_app"}');
INSERT INTO public.school_invitation_codes (id, code, school_id, invitation_type, invited_email, invited_name, invited_by, max_uses, current_uses, expires_at, is_active, created_at, updated_at, preschool_id, used_at, used_by, description, metadata) VALUES ('714bae30-0af9-44a7-b1bb-855021f7a295', 'EWWSV7X9', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'teacher', 'king@youngeagles.org.za', NULL, '3bd86a31-7e78-4075-9d01-9e7606723dea', 1, 0, '2025-09-03 12:25:59.316+00', false, '2025-08-27 12:25:59.456992+00', '2025-08-27 12:25:59.456992+00', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', NULL, NULL, 'Teacher invitation', '{"source": "principal_app"}');
INSERT INTO public.school_invitation_codes (id, code, school_id, invitation_type, invited_email, invited_name, invited_by, max_uses, current_uses, expires_at, is_active, created_at, updated_at, preschool_id, used_at, used_by, description, metadata) VALUES ('06ec484c-f0b3-4772-91f3-b0d61566ac9d', 'ZUV90PHT', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', 'parent', 'parent@pending.local', NULL, '3bd86a31-7e78-4075-9d01-9e7606723dea', 1000, 0, '2025-11-28 17:02:54.679+00', true, '2025-08-30 17:02:55.359298+00', '2025-08-30 17:02:55.359298+00', 'ba79097c-1b93-4b48-bcbe-df73878ab4d1', NULL, NULL, 'Parent invitation code for Young Eagles', '{}');
INSERT INTO public.school_invitation_codes (id, code, school_id, invitation_type, invited_email, invited_name, invited_by, max_uses, current_uses, expires_at, is_active, created_at, updated_at, preschool_id, used_at, used_by, description, metadata) VALUES ('881ef3bd-b364-4c08-ba95-597d2a495940', 'ASICT9IE', '2c37b53d-9092-46a2-955e-6f657368a756', 'parent', 'parent@pending.local', NULL, '3884c8fd-ea74-43cd-bce6-6d0fbcd24110', 1000, 0, '2025-11-30 22:47:36.287+00', true, '2025-09-01 22:47:36.666534+00', '2025-09-01 22:47:36.666534+00', '2c37b53d-9092-46a2-955e-6f657368a756', NULL, NULL, 'Parent invitation code for Fringe', '{}');


--
-- Data for Name: student_registrations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: teacher_invitations; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: video_calls; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: video_call_participants; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- PostgreSQL database dump complete
--

