

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_subscription_status"("school_uuid" "uuid") RETURNS TABLE("is_active" boolean, "plan_id" "text", "status" "text", "days_remaining" integer, "needs_payment" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.status = 'active' as is_active,
        s.plan_id,
        s.status,
        CASE 
            WHEN s.end_date IS NOT NULL 
            THEN EXTRACT(days FROM s.end_date - NOW())::INTEGER
            ELSE NULL
        END as days_remaining,
        s.status IN ('payment_failed', 'expired') as needs_payment
    FROM subscriptions s
    WHERE s.school_id = school_uuid
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."check_subscription_status"("school_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_school_with_admin"("p_school_name" "text", "p_admin_email" "text", "p_admin_name" "text", "p_subscription_plan" "text" DEFAULT 'trial'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_school_id UUID;
  v_tenant_slug TEXT;
  v_result jsonb;
BEGIN
  -- Generate unique tenant slug
  v_tenant_slug := LOWER(REGEXP_REPLACE(p_school_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
  
  -- Insert school record (bypasses RLS due to SECURITY DEFINER)
  INSERT INTO preschools (
    name,
    email,
    subscription_plan,
    subscription_status,
    tenant_slug,
    onboarding_status,
    setup_completed,
    phone,
    address,
    timezone,
    max_students,
    max_teachers,
    created_at,
    updated_at
  ) VALUES (
    p_school_name,
    p_admin_email,
    p_subscription_plan,
    'active',
    v_tenant_slug,
    'completed',
    true,
    '',
    '',
    'Africa/Johannesburg',
    50,
    10,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_school_id;

  -- Return success result
  v_result := jsonb_build_object(
    'success', true,
    'school_id', v_school_id,
    'tenant_slug', v_tenant_slug,
    'message', 'School created successfully'
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error result
  v_result := jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE
  );
  
  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."create_school_with_admin"("p_school_name" "text", "p_admin_email" "text", "p_admin_name" "text", "p_subscription_plan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_specific_superadmin"("p_email" "text", "p_name" "text" DEFAULT 'EduDash Super Administrator'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  auth_user_id uuid;
  user_id uuid;
  result_message text;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO auth_user_id 
  FROM auth.users 
  WHERE email = p_email;
  
  IF auth_user_id IS NOT NULL THEN
    -- User exists in auth, now check/create profile
    SELECT id INTO user_id
    FROM users 
    WHERE auth_user_id = auth_user_id;
    
    IF user_id IS NOT NULL THEN
      -- Update existing user to superadmin
      UPDATE users 
      SET 
        role = 'superadmin',
        is_active = true,
        updated_at = now()
      WHERE id = user_id;
      
      result_message := 'Existing user updated to superadmin';
    ELSE
      -- Create new profile for existing auth user
      INSERT INTO users (
        id,
        email,
        name,
        role,
        auth_user_id,
        is_active,
        profile_completion_status,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        p_email,
        p_name,
        'superadmin',
        auth_user_id,
        true,
        'complete',
        now(),
        now()
      )
      RETURNING id INTO user_id;
      
      result_message := 'Profile created for existing auth user';
    END IF;
  ELSE
    -- Auth user doesn't exist, we need to insert manually into auth.users
    -- Generate a new UUID for the auth user
    auth_user_id := gen_random_uuid();
    
    -- Insert into auth.users (this is unusual but needed for setup)
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      auth_user_id,
      '00000000-0000-0000-0000-000000000000',
      p_email,
      crypt('#Olivia@17', gen_salt('bf')), -- Hash the password
      now(),
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
    
    -- Create the corresponding profile
    INSERT INTO users (
      id,
      email,
      name,
      role,
      auth_user_id,
      is_active,
      profile_completion_status,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_email,
      p_name,
      'superadmin',
      auth_user_id,
      true,
      'complete',
      now(),
      now()
    )
    RETURNING id INTO user_id;
    
    result_message := 'Complete superadmin user created (auth + profile)';
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', result_message,
    'auth_user_id', auth_user_id,
    'profile_user_id', user_id,
    'email', p_email
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error: ' || SQLERRM,
    'error_detail', SQLSTATE
  );
END;
$$;


ALTER FUNCTION "public"."create_specific_superadmin"("p_email" "text", "p_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_superadmin_for_current_user"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_id uuid;
  user_email text;
BEGIN
  -- Get current auth user email
  SELECT email INTO user_email
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Insert or update user as superadmin
  INSERT INTO users (
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    profile_completion_status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    COALESCE(user_email, 'superadmin@edudash.pro'),
    'EduDash Super Administrator',
    'superadmin',
    auth.uid(),
    true,
    'complete',
    now(),
    now()
  )
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now()
  RETURNING id INTO user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Superadmin user created/updated successfully',
    'user_id', user_id
  );
END;
$$;


ALTER FUNCTION "public"."create_superadmin_for_current_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_superadmin_for_current_user"() IS 'Creates/updates current authenticated user as superadmin';



CREATE OR REPLACE FUNCTION "public"."create_teacher_for_preschool"("teacher_email" "text", "teacher_name" "text", "target_preschool_id" "uuid", "teacher_phone" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  new_teacher_id uuid;
begin
  -- Verify caller is principal/admin of the preschool
  if not exists (
    select 1 from public.users 
    where auth_user_id = auth.uid() 
    and preschool_id = target_preschool_id 
    and role in ('principal', 'superadmin')
  ) then
    raise exception 'Only principals can create teachers for their preschool';
  end if;

  -- Check if teacher already exists
  if exists (select 1 from public.users where email = teacher_email) then
    raise exception 'User with this email already exists';
  end if;

  -- Create the teacher user record (will need manual auth.users creation)
  insert into public.users (
    email,
    name,
    role,
    preschool_id,
    phone,
    is_active,
    profile_completion_status
  ) values (
    teacher_email,
    teacher_name,
    'teacher',
    target_preschool_id,
    teacher_phone,
    true,
    'incomplete'
  ) returning id into new_teacher_id;

  return new_teacher_id;
end;
$$;


ALTER FUNCTION "public"."create_teacher_for_preschool"("teacher_email" "text", "teacher_name" "text", "target_preschool_id" "uuid", "teacher_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_test_superadmin"("p_email" "text", "p_name" "text", "p_auth_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Insert or update superadmin user
  INSERT INTO users (
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    profile_completion_status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_email,
    p_name,
    'superadmin',
    p_auth_user_id,
    true,
    'complete',
    now(),
    now()
  )
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now()
  RETURNING id INTO user_id;
  
  RETURN user_id;
END;
$$;


ALTER FUNCTION "public"."create_test_superadmin"("p_email" "text", "p_name" "text", "p_auth_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_test_superadmin"("p_email" "text", "p_name" "text", "p_auth_user_id" "uuid") IS 'Creates or updates a test superadmin user for development';



CREATE OR REPLACE FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_code text;
BEGIN
  v_code := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
  INSERT INTO public.invitation_codes(code, email, role, preschool_id)
  VALUES (v_code, p_email, p_role, p_preschool_id);
  RETURN v_code;
END;
$$;


ALTER FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    year_suffix TEXT;
    sequence_num INT;
    invoice_num TEXT;
BEGIN
    -- Get last two digits of current year
    year_suffix := to_char(NOW(), 'YY');
    
    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(invoice_number FROM 'EDU' || year_suffix || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM billing_invoices
    WHERE invoice_number LIKE 'EDU' || year_suffix || '-%';
    
    -- Format as EDU25-000001
    invoice_num := 'EDU' || year_suffix || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN invoice_num;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_connections"() RETURNS TABLE("connection_id" "uuid", "user_id" "uuid", "preschool_id" "uuid", "connection_type" "text", "status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- For now, return a simple mock structure
  -- You can customize this based on your actual requirements
  RETURN QUERY
  SELECT 
    gen_random_uuid() as connection_id,
    auth.uid() as user_id,
    (SELECT id FROM preschools LIMIT 1) as preschool_id,
    'active'::text as connection_type,
    'connected'::text as status,
    now() as created_at,
    now() as updated_at
  WHERE auth.uid() IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."get_active_connections"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_active_connections"() IS 'Returns active connections for the current user';



CREATE OR REPLACE FUNCTION "public"."get_subscription_analytics"("start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("total_subscriptions" bigint, "active_subscriptions" bigint, "trial_subscriptions" bigint, "cancelled_subscriptions" bigint, "expired_subscriptions" bigint, "monthly_revenue" numeric, "annual_revenue" numeric, "total_revenue" numeric, "avg_revenue_per_school" numeric, "churn_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    date_start TIMESTAMPTZ;
    date_end TIMESTAMPTZ;
BEGIN
    -- Set default date range to current month
    date_start := COALESCE(start_date, date_trunc('month', NOW()));
    date_end := COALESCE(end_date, NOW());
    
    RETURN QUERY
    WITH subscription_stats AS (
        SELECT 
            COUNT(*) as total_subs,
            COUNT(*) FILTER (WHERE status = 'active') as active_subs,
            COUNT(*) FILTER (WHERE status = 'trial') as trial_subs,
            COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_subs,
            COUNT(*) FILTER (WHERE status = 'expired') as expired_subs
        FROM subscriptions
        WHERE created_at BETWEEN date_start AND date_end
    ),
    revenue_stats AS (
        SELECT 
            SUM(amount) FILTER (WHERE pt.metadata->>'billing_frequency' = 'monthly') as monthly_rev,
            SUM(amount) FILTER (WHERE pt.metadata->>'billing_frequency' = 'annual') as annual_rev,
            SUM(amount) as total_rev,
            AVG(amount) as avg_rev
        FROM payment_transactions pt
        WHERE pt.status = 'completed'
        AND pt.created_at BETWEEN date_start AND date_end
    ),
    churn_calc AS (
        SELECT 
            CASE 
                WHEN COUNT(*) FILTER (WHERE status = 'active') > 0 
                THEN (COUNT(*) FILTER (WHERE status = 'cancelled')::DECIMAL / 
                      COUNT(*) FILTER (WHERE status = 'active')) * 100
                ELSE 0
            END as churn
        FROM subscriptions
        WHERE created_at BETWEEN date_start AND date_end
    )
    SELECT 
        ss.total_subs,
        ss.active_subs,
        ss.trial_subs,
        ss.cancelled_subs,
        ss.expired_subs,
        COALESCE(rs.monthly_rev, 0),
        COALESCE(rs.annual_rev, 0),
        COALESCE(rs.total_rev, 0),
        COALESCE(rs.avg_rev, 0),
        COALESCE(cc.churn, 0)
    FROM subscription_stats ss
    CROSS JOIN revenue_stats rs
    CROSS JOIN churn_calc cc;
END;
$$;


ALTER FUNCTION "public"."get_subscription_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_profile_by_auth_id"("p_auth_user_id" "uuid") RETURNS TABLE("id" "uuid", "email" "text", "name" "text", "role" "text", "preschool_id" "uuid", "auth_user_id" "uuid", "is_active" boolean, "avatar_url" "text", "phone" "text", "home_address" "text", "home_city" "text", "home_postal_code" "text", "work_company" "text", "work_position" "text", "work_address" "text", "work_phone" "text", "emergency_contact_1_name" "text", "emergency_contact_1_phone" "text", "emergency_contact_1_relationship" "text", "emergency_contact_2_name" "text", "emergency_contact_2_phone" "text", "emergency_contact_2_relationship" "text", "relationship_to_child" "text", "pickup_authorized" "text", "profile_completed_at" timestamp with time zone, "profile_completion_status" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.preschool_id,
    u.auth_user_id,
    u.is_active,
    u.avatar_url,
    u.phone,
    u.home_address,
    u.home_city,
    u.home_postal_code,
    u.work_company,
    u.work_position,
    u.work_address,
    u.work_phone,
    u.emergency_contact_1_name,
    u.emergency_contact_1_phone,
    u.emergency_contact_1_relationship,
    u.emergency_contact_2_name,
    u.emergency_contact_2_phone,
    u.emergency_contact_2_relationship,
    u.relationship_to_child,
    u.pickup_authorized,
    u.profile_completed_at,
    u.profile_completion_status,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.auth_user_id = p_auth_user_id
  AND u.is_active = true;
END;
$$;


ALTER FUNCTION "public"."get_user_profile_by_auth_id"("p_auth_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_profile_by_auth_id"("p_auth_user_id" "uuid") IS 'Safely retrieves user profile by auth_user_id';



CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Only create if role is set in metadata (prevents auto-creation)
  if new.raw_user_meta_data->>'role' is not null then
    insert into public.users (
      auth_user_id,
      email,
      name,
      role,
      profile_completion_status
    ) values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'role',
      'incomplete'
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."superadmin_approve_onboarding"("request_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_user_role text;
  request_exists boolean;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Access denied: Superadmin role required'
    );
  END IF;
  
  -- Check if request exists
  SELECT EXISTS(
    SELECT 1 FROM preschool_onboarding_requests 
    WHERE id = request_id
  ) INTO request_exists;
  
  IF NOT request_exists THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Onboarding request not found'
    );
  END IF;
  
  -- Update the request status
  UPDATE preschool_onboarding_requests 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  WHERE id = request_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Onboarding request approved successfully'
  );
END;
$$;


ALTER FUNCTION "public"."superadmin_approve_onboarding"("request_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."superadmin_approve_onboarding"("request_id" "uuid") IS 'Allows superadmins to approve preschool onboarding requests';



CREATE OR REPLACE FUNCTION "public"."test_onboarding_access"() RETURNS TABLE("can_select" boolean, "can_insert" boolean, "user_role" "text", "jwt_role" "text", "user_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) > 0 FROM public.preschool_onboarding_requests LIMIT 1) as can_select,
    true as can_insert, -- We'll assume insert works if select works
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) as user_role,
    (auth.jwt() ->> 'role') as jwt_role,
    auth.uid() as user_id;
END;
$$;


ALTER FUNCTION "public"."test_onboarding_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tg_sync_school_preschool_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.school_id IS NULL AND NEW.preschool_id IS NOT NULL THEN
    NEW.school_id := NEW.preschool_id;
  ELSIF NEW.preschool_id IS NULL AND NEW.school_id IS NOT NULL THEN
    NEW.preschool_id := NEW.school_id;
  END IF;
  RETURN NEW;
END
$$;


ALTER FUNCTION "public"."tg_sync_school_preschool_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
BEGIN
  SELECT * INTO v_invitation FROM public.invitation_codes
  WHERE code = p_code AND used_at IS NULL AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  INSERT INTO public.users(
    auth_user_id, email, name, phone, role, preschool_id, is_active, created_at, updated_at
  ) VALUES (
    p_auth_user_id, v_invitation.email, p_name, p_phone, v_invitation.role, v_invitation.preschool_id, true, now(), now()
  ) RETURNING id INTO v_user_id;

  UPDATE public.invitation_codes
  SET used_at = now(), used_by = p_auth_user_id
  WHERE id = v_invitation.id;

  RETURN v_user_id;
END;
$$;


ALTER FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lesson_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "activity_type" "text",
    "instructions" "text",
    "materials_needed" "text",
    "estimated_duration" integer,
    "difficulty_level" "text",
    "age_appropriate_min" integer,
    "age_appropriate_max" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activities_activity_type_check" CHECK (("activity_type" = ANY (ARRAY['quiz'::"text", 'worksheet'::"text", 'video'::"text", 'interactive'::"text", 'reading'::"text"]))),
    CONSTRAINT "activities_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['easy'::"text", 'medium'::"text", 'hard'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "address_type" "text",
    "street_address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'South Africa'::"text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "addresses_address_type_check" CHECK (("address_type" = ANY (ARRAY['home'::"text", 'work'::"text", 'billing'::"text", 'emergency'::"text"])))
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "permissions" "jsonb",
    "last_login_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."age_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "min_age_months" integer,
    "max_age_months" integer,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "preschool_id" "uuid",
    "age_min" integer,
    "age_max" integer
);


ALTER TABLE "public"."age_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_usage_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "feature" "text" NOT NULL,
    "tokens_used" integer DEFAULT 0,
    "cost_usd" numeric(10,4) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_usage_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "author_id" "uuid",
    "target_audience" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "is_published" boolean DEFAULT false,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "announcements_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "announcements_target_audience_check" CHECK (("target_audience" = ANY (ARRAY['all'::"text", 'teachers'::"text", 'parents'::"text", 'students'::"text"])))
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid",
    "teacher_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "assessment_type" "text",
    "total_points" integer DEFAULT 100,
    "due_date" timestamp with time zone,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "assessments_assessment_type_check" CHECK (("assessment_type" = ANY (ARRAY['quiz'::"text", 'test'::"text", 'project'::"text", 'observation'::"text"])))
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text",
    "resource_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."billing_invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school_id" "uuid",
    "subscription_id" "uuid",
    "invoice_number" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "status" "text" NOT NULL,
    "due_date" timestamp with time zone NOT NULL,
    "paid_at" timestamp with time zone,
    "invoice_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "billing_invoices_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'pending'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."billing_invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid",
    "class_id" "uuid",
    "assigned_date" "date" DEFAULT CURRENT_DATE,
    "status" "text" DEFAULT 'active'::"text",
    "start_date" "date" DEFAULT CURRENT_DATE,
    "end_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "class_assignments_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'transferred'::"text"])))
);


ALTER TABLE "public"."class_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "age_group" "text",
    "preschool_id" "uuid" NOT NULL,
    "teacher_id" "uuid",
    "capacity" integer DEFAULT 20,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "room_number" "text",
    "current_enrollment" integer DEFAULT 0 NOT NULL,
    "max_capacity" integer DEFAULT 20 NOT NULL,
    "age_min" integer,
    "age_max" integer,
    "age_group_id" "uuid"
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emergency_contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid",
    "name" "text" NOT NULL,
    "relationship" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "address" "text",
    "is_primary" boolean DEFAULT false,
    "can_pickup" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."emergency_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "location" "text",
    "created_by" "uuid",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "events_event_type_check" CHECK (("event_type" = ANY (ARRAY['field_trip'::"text", 'meeting'::"text", 'performance'::"text", 'holiday'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homework_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "class_id" "uuid",
    "teacher_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" timestamp with time zone,
    "points_possible" integer DEFAULT 100,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."homework_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homework_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "assignment_id" "uuid",
    "student_id" "uuid",
    "submission_text" "text",
    "file_urls" "text"[],
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "grade" integer,
    "feedback" "text",
    "graded_at" timestamp with time zone,
    "graded_by" "uuid",
    "status" "text" DEFAULT 'submitted'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "homework_submissions_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'graded'::"text", 'returned'::"text"])))
);


ALTER TABLE "public"."homework_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_children" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "parent_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "date_of_birth" "date",
    "grade_level" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."independent_children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_content_library" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "content_type" "text",
    "age_group" "text",
    "subject" "text",
    "content_url" "text",
    "preview_url" "text",
    "is_free" boolean DEFAULT false,
    "price_cents" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "independent_content_library_content_type_check" CHECK (("content_type" = ANY (ARRAY['lesson'::"text", 'activity'::"text", 'worksheet'::"text", 'video'::"text"])))
);


ALTER TABLE "public"."independent_content_library" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "code" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_by" "uuid",
    "used_by" "uuid",
    "expires_at" timestamp with time zone,
    "used_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "email" "text",
    "invited_by" "uuid",
    CONSTRAINT "invitation_codes_role_check" CHECK (("role" = ANY (ARRAY['teacher'::"text", 'parent'::"text"])))
);


ALTER TABLE "public"."invitation_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "age_group_id" "uuid",
    "subject" "text",
    "activity_type" "text",
    "instructions" "text",
    "materials" "text",
    "duration_minutes" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."learning_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color_code" "text",
    "icon" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."lesson_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "teacher_id" "uuid",
    "category_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "content" "text",
    "objectives" "text"[],
    "materials_needed" "text",
    "duration_minutes" integer,
    "age_group_min" integer,
    "age_group_max" integer,
    "difficulty_level" "text",
    "is_public" boolean DEFAULT false,
    "is_ai_generated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lessons_difficulty_level_check" CHECK (("difficulty_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "preschool_id" "uuid",
    "filename" "text" NOT NULL,
    "original_filename" "text",
    "file_type" "text",
    "file_size" integer,
    "storage_path" "text",
    "url" "text",
    "is_public" boolean DEFAULT false,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_drafts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid",
    "subject" "text",
    "content" "text",
    "recipient_ids" "uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_recipients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message_id" "uuid",
    "recipient_id" "uuid",
    "read_at" timestamp with time zone,
    "archived_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "sender_id" "uuid",
    "preschool_id" "uuid",
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" "text" DEFAULT 'private'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "sent_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_message_type_check" CHECK (("message_type" = ANY (ARRAY['announcement'::"text", 'private'::"text", 'group'::"text", 'emergency'::"text"]))),
    CONSTRAINT "messages_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "action_url" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'success'::"text", 'error'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."onboarding_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_name" "text" NOT NULL,
    "principal_name" "text" NOT NULL,
    "principal_email" "text" NOT NULL,
    "principal_phone" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "onboarding_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."onboarding_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parent_access_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "student_id" "uuid",
    "code" "text" NOT NULL,
    "created_by" "uuid",
    "used_by" "uuid",
    "expires_at" timestamp with time zone,
    "used_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parent_access_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "text" NOT NULL,
    "school_id" "uuid",
    "subscription_plan_id" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "status" "text" NOT NULL,
    "payfast_payment_id" "text",
    "payfast_token" "text",
    "payment_method" "text" DEFAULT 'payfast'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "amount_cents" integer NOT NULL,
    "currency" "text" DEFAULT 'ZAR'::"text",
    "payment_method" "text",
    "payment_provider" "text",
    "provider_payment_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_analytics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(15,2),
    "dimensions" "jsonb",
    "recorded_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preschool_onboarding_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "school_name" "text",
    "principal_name" "text",
    "principal_email" "text",
    "principal_phone" "text",
    "registration_number" "text",
    "address" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "admin_name" "text",
    "admin_email" "text",
    "preschool_name" "text",
    "number_of_students" integer,
    "number_of_teachers" integer,
    "message" "text",
    "phone" "text",
    CONSTRAINT "preschool_onboarding_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."preschool_onboarding_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preschools" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "registration_number" "text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "subscription_tier" "text" DEFAULT 'basic'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "subscription_plan_id" "uuid",
    "onboarding_status" character varying(20) DEFAULT 'requested'::character varying,
    "tenant_slug" character varying(50),
    "subscription_plan" character varying(20) DEFAULT 'trial'::character varying,
    "subscription_status" character varying(20) DEFAULT 'pending'::character varying,
    "setup_completed" boolean DEFAULT false,
    "max_students" integer DEFAULT 50,
    "max_teachers" integer DEFAULT 10,
    "billing_email" character varying(255),
    "subscription_start_date" "date",
    "subscription_end_date" "date",
    "domain" character varying(100),
    "timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "logo_url" "text",
    "payfast_token" "text",
    CONSTRAINT "preschools_onboarding_status_check" CHECK ((("onboarding_status")::"text" = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'setup'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "preschools_subscription_plan_check" CHECK ((("subscription_plan")::"text" = ANY ((ARRAY['trial'::character varying, 'basic'::character varying, 'premium'::character varying, 'enterprise'::character varying])::"text"[]))),
    CONSTRAINT "preschools_subscription_status_check" CHECK ((("subscription_status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::"text"[]))),
    CONSTRAINT "preschools_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['basic'::"text", 'premium'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."preschools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_invitation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" character varying(20) NOT NULL,
    "school_id" "uuid",
    "invitation_type" character varying(20) NOT NULL,
    "invited_email" character varying(255),
    "invited_name" character varying(255),
    "invited_by" "uuid",
    "max_uses" integer DEFAULT 1,
    "current_uses" integer DEFAULT 0,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "preschool_id" "uuid" NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "school_invitation_codes_invitation_type_check" CHECK ((("invitation_type")::"text" = ANY ((ARRAY['principal'::character varying, 'teacher'::character varying, 'parent'::character varying])::"text"[])))
);


ALTER TABLE "public"."school_invitation_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."schools" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text",
    "address" "text",
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schools_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."schools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_registrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "date_of_birth" "date",
    "parent_name" "text",
    "parent_email" "text",
    "parent_phone" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_registrations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."student_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "date_of_birth" "date",
    "preschool_id" "uuid" NOT NULL,
    "class_id" "uuid",
    "parent_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "age_group_id" "uuid",
    "enrollment_date" "date",
    "gender" "text",
    "medical_conditions" "text",
    "allergies" "text",
    "emergency_contact_name" "text",
    "emergency_contact_phone" "text",
    "emergency_contact_relation" "text"
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "price_monthly" numeric(10,2),
    "price_annual" numeric(10,2),
    "features" "jsonb",
    "ai_quota_monthly" integer,
    "max_students" integer,
    "max_teachers" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "school_id" "uuid",
    "plan_id" "text" NOT NULL,
    "status" "text" NOT NULL,
    "billing_frequency" "text" NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "next_billing_date" timestamp with time zone,
    "payfast_token" "text",
    "payfast_payment_id" "text",
    "trial_end_date" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subscriptions_billing_frequency_check" CHECK (("billing_frequency" = ANY (ARRAY['monthly'::"text", 'annual'::"text"]))),
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'payment_failed'::"text", 'trial'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "preschool_id" "uuid",
    "subject" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'open'::"text",
    "assigned_to" "text",
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "support_tickets_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'urgent'::"text"]))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'in_progress'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "key" "text" NOT NULL,
    "value" "text",
    "description" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_invitations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text",
    "invited_by" "uuid",
    "invitation_code" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "expires_at" timestamp with time zone,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."teacher_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "theme" "text" DEFAULT 'light'::"text",
    "language" "text" DEFAULT 'en'::"text",
    "timezone" "text" DEFAULT 'Africa/Johannesburg'::"text",
    "notifications_email" boolean DEFAULT true,
    "notifications_push" boolean DEFAULT true,
    "notifications_sms" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_preferences_theme_check" CHECK (("theme" = ANY (ARRAY['light'::"text", 'dark'::"text", 'auto'::"text"])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "auth_user_id" "uuid",
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "phone" "text",
    "is_active" boolean DEFAULT true,
    "profile_completion_status" "text" DEFAULT 'incomplete'::"text",
    "preschool_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "users_profile_completion_status_check" CHECK (("profile_completion_status" = ANY (ARRAY['incomplete'::"text", 'complete'::"text"]))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['superadmin'::"text", 'principal'::"text", 'teacher'::"text", 'parent'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_call_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "call_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "student_id" "uuid",
    "joined_at" timestamp with time zone,
    "left_at" timestamp with time zone,
    "duration_minutes" integer,
    "invitation_sent" boolean DEFAULT false,
    "invitation_sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'invited'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "video_call_participants_status_check" CHECK (("status" = ANY (ARRAY['invited'::"text", 'joined'::"text", 'left'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."video_call_participants" OWNER TO "postgres";


COMMENT ON TABLE "public"."video_call_participants" IS 'Participants in video calls with join/leave tracking';



CREATE TABLE IF NOT EXISTS "public"."video_calls" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "class_id" "uuid",
    "teacher_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "meeting_id" "text",
    "meeting_password" "text",
    "meeting_url" "text",
    "scheduled_start" timestamp with time zone NOT NULL,
    "scheduled_end" timestamp with time zone NOT NULL,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "status" "text" DEFAULT 'scheduled'::"text",
    "max_participants" integer DEFAULT 50,
    "recording_enabled" boolean DEFAULT false,
    "recording_url" "text",
    "waiting_room_enabled" boolean DEFAULT true,
    "require_password" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "video_calls_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."video_calls" OWNER TO "postgres";


COMMENT ON TABLE "public"."video_calls" IS 'Video conference calls for classes and meetings';



CREATE TABLE IF NOT EXISTS "public"."webhook_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "payload" "jsonb",
    "processed_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" NOT NULL,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "webhook_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'ignored'::"text"])))
);


ALTER TABLE "public"."webhook_logs" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."age_groups"
    ADD CONSTRAINT "age_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_student_id_class_id_key" UNIQUE ("student_id", "class_id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emergency_contacts"
    ADD CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_assignment_id_student_id_key" UNIQUE ("assignment_id", "student_id");



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_children"
    ADD CONSTRAINT "independent_children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_content_library"
    ADD CONSTRAINT "independent_content_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."learning_activities"
    ADD CONSTRAINT "learning_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_categories"
    ADD CONSTRAINT "lesson_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_uploads"
    ADD CONSTRAINT "media_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_drafts"
    ADD CONSTRAINT "message_drafts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_message_id_recipient_id_key" UNIQUE ("message_id", "recipient_id");



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."onboarding_requests"
    ADD CONSTRAINT "onboarding_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_analytics"
    ADD CONSTRAINT "platform_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preschool_onboarding_requests"
    ADD CONSTRAINT "preschool_onboarding_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preschools"
    ADD CONSTRAINT "preschools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preschools"
    ADD CONSTRAINT "preschools_registration_number_key" UNIQUE ("registration_number");



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schools"
    ADD CONSTRAINT "schools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_registrations"
    ADD CONSTRAINT "student_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_school_id_key" UNIQUE ("school_id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_invitation_code_key" UNIQUE ("invitation_code");



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_unique" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_call_participants"
    ADD CONSTRAINT "video_call_participants_call_id_user_id_key" UNIQUE ("call_id", "user_id");



ALTER TABLE ONLY "public"."video_call_participants"
    ADD CONSTRAINT "video_call_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_calls"
    ADD CONSTRAINT "video_calls_meeting_id_key" UNIQUE ("meeting_id");



ALTER TABLE ONLY "public"."video_calls"
    ADD CONSTRAINT "video_calls_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_logs"
    ADD CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_age_groups_preschool_id" ON "public"."age_groups" USING "btree" ("preschool_id");



CREATE INDEX "idx_billing_invoices_due_date" ON "public"."billing_invoices" USING "btree" ("due_date");



CREATE INDEX "idx_billing_invoices_school_id" ON "public"."billing_invoices" USING "btree" ("school_id");



CREATE INDEX "idx_billing_invoices_status" ON "public"."billing_invoices" USING "btree" ("status");



CREATE INDEX "idx_classes_preschool_id" ON "public"."classes" USING "btree" ("preschool_id");



CREATE INDEX "idx_classes_teacher_id" ON "public"."classes" USING "btree" ("teacher_id");



CREATE INDEX "idx_onboarding_requests_admin_email" ON "public"."preschool_onboarding_requests" USING "btree" ("admin_email");



CREATE INDEX "idx_onboarding_requests_created_at" ON "public"."preschool_onboarding_requests" USING "btree" ("created_at");



CREATE INDEX "idx_onboarding_requests_status" ON "public"."preschool_onboarding_requests" USING "btree" ("status");



CREATE INDEX "idx_payment_transactions_created_at" ON "public"."payment_transactions" USING "btree" ("created_at");



CREATE INDEX "idx_payment_transactions_payfast_payment_id" ON "public"."payment_transactions" USING "btree" ("payfast_payment_id");



CREATE INDEX "idx_payment_transactions_school_id" ON "public"."payment_transactions" USING "btree" ("school_id");



CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE UNIQUE INDEX "idx_preschools_tenant_slug_unique" ON "public"."preschools" USING "btree" ("tenant_slug") WHERE ("tenant_slug" IS NOT NULL);



CREATE INDEX "idx_school_inv_codes_preschool" ON "public"."school_invitation_codes" USING "btree" ("preschool_id");



CREATE INDEX "idx_school_invitation_codes_code" ON "public"."school_invitation_codes" USING "btree" ("code");



CREATE INDEX "idx_school_invitation_codes_school_id" ON "public"."school_invitation_codes" USING "btree" ("school_id");



CREATE INDEX "idx_students_class_id" ON "public"."students" USING "btree" ("class_id");



CREATE INDEX "idx_students_parent_id" ON "public"."students" USING "btree" ("parent_id");



CREATE INDEX "idx_students_preschool_id" ON "public"."students" USING "btree" ("preschool_id");



CREATE INDEX "idx_subscriptions_next_billing_date" ON "public"."subscriptions" USING "btree" ("next_billing_date");



CREATE INDEX "idx_subscriptions_payfast_token" ON "public"."subscriptions" USING "btree" ("payfast_token");



CREATE INDEX "idx_subscriptions_school_id" ON "public"."subscriptions" USING "btree" ("school_id");



CREATE INDEX "idx_subscriptions_status" ON "public"."subscriptions" USING "btree" ("status");



CREATE INDEX "idx_teacher_invitations_email" ON "public"."teacher_invitations" USING "btree" ("email");



CREATE INDEX "idx_teacher_invitations_preschool_id" ON "public"."teacher_invitations" USING "btree" ("preschool_id");



CREATE INDEX "idx_teacher_invitations_status" ON "public"."teacher_invitations" USING "btree" ("status");



CREATE INDEX "idx_users_preschool_id" ON "public"."users" USING "btree" ("preschool_id");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_video_call_participants_call_id" ON "public"."video_call_participants" USING "btree" ("call_id");



CREATE INDEX "idx_video_call_participants_user_id" ON "public"."video_call_participants" USING "btree" ("user_id");



CREATE INDEX "idx_video_calls_preschool_id" ON "public"."video_calls" USING "btree" ("preschool_id");



CREATE INDEX "idx_video_calls_scheduled_start" ON "public"."video_calls" USING "btree" ("scheduled_start");



CREATE INDEX "idx_video_calls_status" ON "public"."video_calls" USING "btree" ("status");



CREATE INDEX "idx_webhook_logs_created_at" ON "public"."webhook_logs" USING "btree" ("created_at");



CREATE INDEX "idx_webhook_logs_event_type" ON "public"."webhook_logs" USING "btree" ("event_type");



CREATE INDEX "idx_webhook_logs_source" ON "public"."webhook_logs" USING "btree" ("source");



CREATE UNIQUE INDEX "preschools_email_key" ON "public"."preschools" USING "btree" ("email");



CREATE UNIQUE INDEX "preschools_tenant_slug_key" ON "public"."preschools" USING "btree" ("tenant_slug");



CREATE OR REPLACE TRIGGER "billing_invoices_updated_at" BEFORE UPDATE ON "public"."billing_invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "payment_transactions_updated_at" BEFORE UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "set_preschools_updated_at" BEFORE UPDATE ON "public"."preschools" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "set_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_school_preschool_id" BEFORE INSERT OR UPDATE ON "public"."school_invitation_codes" FOR EACH ROW EXECUTE FUNCTION "public"."tg_sync_school_preschool_id"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_usage_logs"
    ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."billing_invoices"
    ADD CONSTRAINT "billing_invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."emergency_contacts"
    ADD CONSTRAINT "emergency_contacts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."homework_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_children"
    ADD CONSTRAINT "independent_children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."learning_activities"
    ADD CONSTRAINT "learning_activities_age_group_id_fkey" FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."lesson_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."media_uploads"
    ADD CONSTRAINT "media_uploads_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media_uploads"
    ADD CONSTRAINT "media_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_drafts"
    ADD CONSTRAINT "message_drafts_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preschools"
    ADD CONSTRAINT "preschools_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."student_registrations"
    ADD CONSTRAINT "student_registrations_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."video_call_participants"
    ADD CONSTRAINT "video_call_participants_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "public"."video_calls"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_call_participants"
    ADD CONSTRAINT "video_call_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_call_participants"
    ADD CONSTRAINT "video_call_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_calls"
    ADD CONSTRAINT "video_calls_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."video_calls"
    ADD CONSTRAINT "video_calls_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_calls"
    ADD CONSTRAINT "video_calls_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view active age groups" ON "public"."age_groups" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view active subscription plans" ON "public"."subscription_plans" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Anyone can view public learning activities" ON "public"."learning_activities" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view public lesson categories" ON "public"."lesson_categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Parents can view emergency contacts for their children" ON "public"."emergency_contacts" FOR SELECT USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."parent_id" = ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "Parents can view their children" ON "public"."students" FOR SELECT USING (("parent_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Principals can manage announcements in their preschool" ON "public"."announcements" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can manage classes in their preschool" ON "public"."classes" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can manage events in their preschool" ON "public"."events" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can manage invitation codes for their preschool" ON "public"."invitation_codes" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can manage lessons in their preschool" ON "public"."lessons" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can manage students in their preschool" ON "public"."students" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can manage teacher invitations for their preschool" ON "public"."teacher_invitations" USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can update their preschool" ON "public"."preschools" FOR UPDATE USING (("id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "Principals can view emergency contacts in their preschool" ON "public"."emergency_contacts" FOR SELECT USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."preschool_id" = ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))))));



CREATE POLICY "Principals can view payments for their preschool" ON "public"."payments" FOR SELECT USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = ANY (ARRAY['principal'::"text", 'preschool_admin'::"text"]))))));



CREATE POLICY "School admins can view own invoices" ON "public"."billing_invoices" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."preschool_id" = "billing_invoices"."school_id") AND ("users"."role" = ANY (ARRAY['principal'::"text", 'school_admin'::"text"])) AND ("users"."is_active" = true)))));



CREATE POLICY "School admins can view own payment transactions" ON "public"."payment_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."preschool_id" = "payment_transactions"."school_id") AND ("users"."role" = ANY (ARRAY['principal'::"text", 'school_admin'::"text"])) AND ("users"."is_active" = true)))));



CREATE POLICY "School admins can view own subscription" ON "public"."subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."preschool_id" = "subscriptions"."school_id") AND ("users"."role" = ANY (ARRAY['principal'::"text", 'school_admin'::"text"])) AND ("users"."is_active" = true)))));



CREATE POLICY "Students can manage their own submissions" ON "public"."homework_submissions" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE ("students"."parent_id" = ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "Students can view homework for their classes" ON "public"."homework_assignments" FOR SELECT USING (("class_id" IN ( SELECT "students"."class_id"
   FROM "public"."students"
  WHERE ("students"."parent_id" = ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "SuperAdmins can manage ai_usage_logs" ON "public"."ai_usage_logs" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all classes" ON "public"."classes" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."activities" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."addresses" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."admin_users" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."announcements" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."assessments" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."class_assignments" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."emergency_contacts" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."events" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."homework_assignments" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."homework_submissions" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."independent_children" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."independent_content_library" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."invitation_codes" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."learning_activities" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."lessons" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."media_uploads" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."message_drafts" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."message_recipients" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."messages" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."notifications" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."onboarding_requests" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."parent_access_codes" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."payments" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."schools" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."student_registrations" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."support_tickets" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."teacher_invitations" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all data" ON "public"."user_preferences" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all preschools" ON "public"."preschools" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all students" ON "public"."students" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage all users" ON "public"."users" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage audit_logs" ON "public"."audit_logs" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage onboarding requests" ON "public"."preschool_onboarding_requests" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage onboarding via users table" ON "public"."preschool_onboarding_requests" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "SuperAdmins can manage platform_analytics" ON "public"."platform_analytics" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage subscription_plans" ON "public"."subscription_plans" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can manage system_settings" ON "public"."system_settings" USING ((("auth"."jwt"() ->> 'role'::"text") = 'superadmin'::"text"));



CREATE POLICY "SuperAdmins can view all invoices" ON "public"."billing_invoices" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "SuperAdmins can view all payment transactions" ON "public"."payment_transactions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "SuperAdmins can view all subscriptions" ON "public"."subscriptions" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "SuperAdmins can view webhook logs" ON "public"."webhook_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text") AND ("users"."is_active" = true)))));



CREATE POLICY "Teachers can manage activities for their lessons" ON "public"."activities" USING (("lesson_id" IN ( SELECT "lessons"."id"
   FROM "public"."lessons"
  WHERE ("lessons"."teacher_id" = ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "Teachers can manage assessments for their classes" ON "public"."assessments" USING ((("teacher_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND ("class_id" IN ( SELECT "classes"."id"
   FROM "public"."classes"
  WHERE ("classes"."preschool_id" = ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "Teachers can manage homework in their classes" ON "public"."homework_assignments" USING ((("teacher_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND ("class_id" IN ( SELECT "classes"."id"
   FROM "public"."classes"
  WHERE ("classes"."preschool_id" = ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"())))))));



CREATE POLICY "Teachers can manage their lessons" ON "public"."lessons" USING ((("teacher_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND ("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Teachers can manage video calls" ON "public"."video_calls" USING (("teacher_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can update their classes" ON "public"."classes" FOR UPDATE USING (("teacher_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'teacher'::"text")))));



CREATE POLICY "Teachers can view students in their classes" ON "public"."students" FOR SELECT USING (("class_id" IN ( SELECT "classes"."id"
   FROM "public"."classes"
  WHERE ("classes"."teacher_id" = ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "Teachers can view their assigned classes" ON "public"."classes" FOR SELECT USING (("teacher_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Teachers can view/grade submissions in their classes" ON "public"."homework_submissions" USING (("assignment_id" IN ( SELECT "homework_assignments"."id"
   FROM "public"."homework_assignments"
  WHERE ("homework_assignments"."teacher_id" = ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can manage their own addresses" ON "public"."addresses" USING (("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can manage their own preferences" ON "public"."user_preferences" USING (("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can send messages in their preschool" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND ("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their message status" ON "public"."message_recipients" FOR UPDATE USING (("recipient_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "auth_user_id")) WITH CHECK (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "Users can upload media to their preschool" ON "public"."media_uploads" FOR INSERT WITH CHECK ((("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND ("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view activities for accessible lessons" ON "public"."activities" FOR SELECT USING (("lesson_id" IN ( SELECT "lessons"."id"
   FROM "public"."lessons"
  WHERE (("lessons"."preschool_id" = ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))) OR ("lessons"."is_public" = true)))));



CREATE POLICY "Users can view announcements in their preschool" ON "public"."announcements" FOR SELECT USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view class assignments in their preschool" ON "public"."class_assignments" FOR SELECT USING (("class_id" IN ( SELECT "classes"."id"
   FROM "public"."classes"
  WHERE ("classes"."preschool_id" = ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view classes in their preschool" ON "public"."classes" FOR SELECT USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view events in their preschool" ON "public"."events" FOR SELECT USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view lessons in their preschool" ON "public"."lessons" FOR SELECT USING ((("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) OR ("is_public" = true)));



CREATE POLICY "Users can view media in their preschool" ON "public"."media_uploads" FOR SELECT USING ((("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) OR ("is_public" = true)));



CREATE POLICY "Users can view messages in their preschool" ON "public"."messages" FOR SELECT USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view students in their preschool" ON "public"."students" FOR SELECT USING (("preschool_id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "auth_user_id"));



CREATE POLICY "Users can view their preschool" ON "public"."preschools" FOR SELECT USING (("id" = ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their received messages" ON "public"."message_recipients" FOR SELECT USING (("recipient_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their video call participations" ON "public"."video_call_participants" FOR SELECT USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view video calls in their preschool" ON "public"."video_calls" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."age_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_usage_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ai_usage_logs_superadmin_all" ON "public"."ai_usage_logs" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text")))));



CREATE POLICY "ai_usage_logs_system_insert" ON "public"."ai_usage_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "ai_usage_logs_user_select" ON "public"."ai_usage_logs" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text"))))));



CREATE POLICY "allow_anonymous_onboarding_requests" ON "public"."preschool_onboarding_requests" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_users_select_age_groups" ON "public"."age_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "authenticated_users_select_lesson_categories" ON "public"."lesson_categories" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."billing_invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_teacher_invitations_by_preschool_admin" ON "public"."teacher_invitations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id") AND ("u"."role" = ANY (ARRAY['principal'::"text", 'admin'::"text", 'preschool_admin'::"text", 'superadmin'::"text"]))))));



ALTER TABLE "public"."emergency_contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."homework_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."homework_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_content_library" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_teacher_invitations_by_preschool_admin" ON "public"."teacher_invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id") AND ("u"."role" = ANY (ARRAY['principal'::"text", 'admin'::"text", 'preschool_admin'::"text", 'superadmin'::"text"]))))));



ALTER TABLE "public"."invitation_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_recipients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."onboarding_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parent_access_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preschool_onboarding_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preschools" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_onboarding_access" ON "public"."preschool_onboarding_requests" FOR INSERT WITH CHECK (true);



ALTER TABLE "public"."school_invitation_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schools" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select_teacher_invitations_by_preschool" ON "public"."teacher_invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id") AND ("u"."role" = ANY (ARRAY['principal'::"text", 'admin'::"text", 'preschool_admin'::"text", 'superadmin'::"text"]))))));



ALTER TABLE "public"."student_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "superadmin_manage_age_groups" ON "public"."age_groups" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text")))));



CREATE POLICY "superadmin_manage_lesson_categories" ON "public"."lesson_categories" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text")))));



ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_invitations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_teacher_invitations_by_preschool_admin" ON "public"."teacher_invitations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id") AND ("u"."role" = ANY (ARRAY['principal'::"text", 'admin'::"text", 'preschool_admin'::"text", 'superadmin'::"text"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id") AND ("u"."role" = ANY (ARRAY['principal'::"text", 'admin'::"text", 'preschool_admin'::"text", 'superadmin'::"text"]))))));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."video_call_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."video_calls" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_logs" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_subscription_status"("school_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_subscription_status"("school_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_subscription_status"("school_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_school_with_admin"("p_school_name" "text", "p_admin_email" "text", "p_admin_name" "text", "p_subscription_plan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_school_with_admin"("p_school_name" "text", "p_admin_email" "text", "p_admin_name" "text", "p_subscription_plan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_school_with_admin"("p_school_name" "text", "p_admin_email" "text", "p_admin_name" "text", "p_subscription_plan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_specific_superadmin"("p_email" "text", "p_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_specific_superadmin"("p_email" "text", "p_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_specific_superadmin"("p_email" "text", "p_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_superadmin_for_current_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_superadmin_for_current_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_superadmin_for_current_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_teacher_for_preschool"("teacher_email" "text", "teacher_name" "text", "target_preschool_id" "uuid", "teacher_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_teacher_for_preschool"("teacher_email" "text", "teacher_name" "text", "target_preschool_id" "uuid", "teacher_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_teacher_for_preschool"("teacher_email" "text", "teacher_name" "text", "target_preschool_id" "uuid", "teacher_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_test_superadmin"("p_email" "text", "p_name" "text", "p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_test_superadmin"("p_email" "text", "p_name" "text", "p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_test_superadmin"("p_email" "text", "p_name" "text", "p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_connections"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_connections"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_connections"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_subscription_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_subscription_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_subscription_analytics"("start_date" timestamp with time zone, "end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile_by_auth_id"("p_auth_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile_by_auth_id"("p_auth_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile_by_auth_id"("p_auth_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."superadmin_approve_onboarding"("request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."superadmin_approve_onboarding"("request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."superadmin_approve_onboarding"("request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_onboarding_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_onboarding_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_onboarding_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tg_sync_school_preschool_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."tg_sync_school_preschool_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tg_sync_school_preschool_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."age_groups" TO "anon";
GRANT ALL ON TABLE "public"."age_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."age_groups" TO "service_role";



GRANT ALL ON TABLE "public"."ai_usage_logs" TO "anon";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_usage_logs" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."billing_invoices" TO "anon";
GRANT ALL ON TABLE "public"."billing_invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."billing_invoices" TO "service_role";



GRANT ALL ON TABLE "public"."class_assignments" TO "anon";
GRANT ALL ON TABLE "public"."class_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."class_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."emergency_contacts" TO "anon";
GRANT ALL ON TABLE "public"."emergency_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."emergency_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."homework_assignments" TO "anon";
GRANT ALL ON TABLE "public"."homework_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."homework_submissions" TO "anon";
GRANT ALL ON TABLE "public"."homework_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."independent_children" TO "anon";
GRANT ALL ON TABLE "public"."independent_children" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_children" TO "service_role";



GRANT ALL ON TABLE "public"."independent_content_library" TO "anon";
GRANT ALL ON TABLE "public"."independent_content_library" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_content_library" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_codes" TO "anon";
GRANT ALL ON TABLE "public"."invitation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_codes" TO "service_role";



GRANT ALL ON TABLE "public"."learning_activities" TO "anon";
GRANT ALL ON TABLE "public"."learning_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."learning_activities" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_categories" TO "anon";
GRANT ALL ON TABLE "public"."lesson_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_categories" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."media_uploads" TO "anon";
GRANT ALL ON TABLE "public"."media_uploads" TO "authenticated";
GRANT ALL ON TABLE "public"."media_uploads" TO "service_role";



GRANT ALL ON TABLE "public"."message_drafts" TO "anon";
GRANT ALL ON TABLE "public"."message_drafts" TO "authenticated";
GRANT ALL ON TABLE "public"."message_drafts" TO "service_role";



GRANT ALL ON TABLE "public"."message_recipients" TO "anon";
GRANT ALL ON TABLE "public"."message_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."message_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_requests" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_requests" TO "service_role";



GRANT ALL ON TABLE "public"."parent_access_codes" TO "anon";
GRANT ALL ON TABLE "public"."parent_access_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."parent_access_codes" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."platform_analytics" TO "anon";
GRANT ALL ON TABLE "public"."platform_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."platform_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."preschool_onboarding_requests" TO "anon";
GRANT ALL ON TABLE "public"."preschool_onboarding_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."preschool_onboarding_requests" TO "service_role";



GRANT ALL ON TABLE "public"."preschools" TO "anon";
GRANT ALL ON TABLE "public"."preschools" TO "authenticated";
GRANT ALL ON TABLE "public"."preschools" TO "service_role";



GRANT ALL ON TABLE "public"."school_invitation_codes" TO "anon";
GRANT ALL ON TABLE "public"."school_invitation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."school_invitation_codes" TO "service_role";



GRANT ALL ON TABLE "public"."schools" TO "anon";
GRANT ALL ON TABLE "public"."schools" TO "authenticated";
GRANT ALL ON TABLE "public"."schools" TO "service_role";



GRANT ALL ON TABLE "public"."student_registrations" TO "anon";
GRANT ALL ON TABLE "public"."student_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."student_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_invitations" TO "anon";
GRANT ALL ON TABLE "public"."teacher_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."video_call_participants" TO "anon";
GRANT ALL ON TABLE "public"."video_call_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."video_call_participants" TO "service_role";



GRANT ALL ON TABLE "public"."video_calls" TO "anon";
GRANT ALL ON TABLE "public"."video_calls" TO "authenticated";
GRANT ALL ON TABLE "public"."video_calls" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_logs" TO "anon";
GRANT ALL ON TABLE "public"."webhook_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_logs" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
