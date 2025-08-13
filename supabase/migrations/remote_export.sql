

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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."__ensure_policy"("p_schema" "text", "p_table" "text", "p_policy" "text", "p_cmd" "text", "p_using" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = p_schema and tablename = p_table and policyname = p_policy
  ) then
    execute format('create policy %I on %I.%I for %s using (%s)',
                   p_policy, p_schema, p_table, p_cmd, p_using);
  end if;
end;$$;


ALTER FUNCTION "public"."__ensure_policy"("p_schema" "text", "p_table" "text", "p_policy" "text", "p_cmd" "text", "p_using" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_student_age"("birth_date" "date") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  age INTEGER;
BEGIN
  SELECT EXTRACT(YEAR FROM AGE(birth_date)) INTO age;
  RETURN age;
END;
$$;


ALTER FUNCTION "public"."calculate_student_age"("birth_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_access_preschool"("target_preschool_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  IF public.is_superadmin() THEN
    RETURN true;
  END IF;
  RETURN COALESCE(public.get_current_user_preschool_id() = target_preschool_id, false);
END;
$$;


ALTER FUNCTION "public"."can_access_preschool"("target_preschool_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_parent_invitation"("p_preschool_id" "uuid", "p_student_id" "uuid", "p_email" "text", "p_student_name" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_code text;
  v_invitation_id uuid;
BEGIN
  -- Generate a unique parent access code
  v_code := upper(substring(md5(random()::text) from 1 for 6));
  
  -- Insert parent access code
  INSERT INTO public.parent_access_codes (
    preschool_id,
    student_id,
    code,
    parent_email,
    student_name,
    expires_at
  ) VALUES (
    p_preschool_id,
    p_student_id,
    v_code,
    p_email,
    p_student_name,
    now() + interval '30 days'
  ) RETURNING id INTO v_invitation_id;
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'code', v_code,
    'expires_at', now() + interval '30 days'
  );
END;
$$;


ALTER FUNCTION "public"."create_parent_invitation"("p_preschool_id" "uuid", "p_student_id" "uuid", "p_email" "text", "p_student_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_teacher_invitation"("p_preschool_id" "uuid", "p_email" "text", "p_invited_by" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_code text;
  v_invitation_id uuid;
BEGIN
  -- Generate a unique invitation code
  v_code := upper(substring(md5(random()::text) from 1 for 8));
  
  -- Insert invitation
  INSERT INTO public.school_invitation_codes (
    preschool_id,
    code,
    invitation_type,
    invited_email,
    invited_by,
    expires_at
  ) VALUES (
    p_preschool_id,
    v_code,
    'teacher',
    p_email,
    p_invited_by,
    now() + interval '7 days'
  ) RETURNING id INTO v_invitation_id;
  
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'code', v_code,
    'expires_at', now() + interval '7 days'
  );
END;
$$;


ALTER FUNCTION "public"."create_teacher_invitation"("p_preschool_id" "uuid", "p_email" "text", "p_invited_by" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_tenant_with_admin"("p_name" character varying, "p_email" character varying, "p_admin_name" character varying, "p_tenant_slug" character varying, "p_subscription_plan" character varying DEFAULT 'basic'::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
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
    (tenant_id, 'branding_setup', 'pending'),
    (tenant_id, 'billing', 'pending'),
    (tenant_id, 'completed', 'pending');
    
    -- Initialize default branding settings
    INSERT INTO tenant_settings (preschool_id, setting_key, setting_value) VALUES
    (tenant_id, 'branding.school_name', to_jsonb(p_name)),
    (tenant_id, 'branding.logo_url', to_jsonb(null::text)),
    (tenant_id, 'branding.primary_color', to_jsonb('#3b82f6')),
    (tenant_id, 'branding.secondary_color', to_jsonb('#f8fafc')),
    (tenant_id, 'branding.accent_color', to_jsonb('#10b981')),
    (tenant_id, 'branding.show_edudash_branding', to_jsonb(true)),
    (tenant_id, 'branding.dashboard_title', to_jsonb(p_name || ' Dashboard')),
    (tenant_id, 'branding.parent_portal_title', to_jsonb(p_name || ' Parent Portal'));
    
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
$$;


ALTER FUNCTION "public"."create_tenant_with_admin"("p_name" character varying, "p_email" character varying, "p_admin_name" character varying, "p_tenant_slug" character varying, "p_subscription_plan" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."current_user_preschool_ids"() RETURNS "uuid"[]
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select coalesce(array_agg(preschool_id), '{}')
  from public.users
  where auth_user_id = auth.uid();
$$;


ALTER FUNCTION "public"."current_user_preschool_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_class_enrollment"("class_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE classes 
    SET current_enrollment = GREATEST(current_enrollment - 1, 0)
    WHERE id = class_id_param;
END;
$$;


ALTER FUNCTION "public"."decrement_class_enrollment"("class_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_code text;
  v_user_info RECORD;
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  v_length int := 8;
  v_i int;
BEGIN
  -- Get current user's info
  SELECT * INTO v_user_info FROM get_user_preschool_info(auth.uid());
  
  -- Check if current user is admin of the target preschool
  IF NOT is_preschool_admin(auth.uid(), p_preschool_id) THEN
    RAISE EXCEPTION 'Access denied: You are not an admin of this preschool';
  END IF;
  
  -- Generate a unique 8-character code using random() instead of gen_random_bytes
  v_code := '';
  FOR v_i IN 1..v_length LOOP
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  END LOOP;
  
  -- Ensure uniqueness by checking existing codes and regenerating if needed
  WHILE EXISTS (SELECT 1 FROM public.invitation_codes WHERE code = v_code) LOOP
    v_code := '';
    FOR v_i IN 1..v_length LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
  END LOOP;
  
  -- Insert invitation code
  INSERT INTO public.invitation_codes (
    code,
    email,
    role,
    preschool_id,
    invited_by
  ) VALUES (
    v_code,
    p_email,
    p_role,
    p_preschool_id,
    auth.uid()
  );
  
  RETURN v_code;
END;
$$;


ALTER FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_preschool_id"() RETURNS "uuid"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT preschool_id 
    FROM public.users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_current_user_preschool_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1
  );
END;
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_overdue_fees_count"("parent_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  overdue_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO overdue_count
  FROM payment_fees pf
  JOIN students s ON pf.student_id = s.id
  WHERE s.parent_id = parent_uuid 
    AND pf.is_overdue = true 
    AND pf.is_paid = false;
    
  RETURN COALESCE(overdue_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_overdue_fees_count"("parent_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_class_info"("student_uuid" "uuid") RETURNS TABLE("class_name" character varying, "teacher_name" character varying, "room_number" character varying, "age_group_name" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as class_name,
    p.name as teacher_name,
    c.room_number,
    ag.name as age_group_name
  FROM students s
  JOIN classes c ON s.class_id = c.id
  LEFT JOIN users p ON c.teacher_id = p.id
  JOIN age_groups ag ON s.age_group_id = ag.id
  WHERE s.id = student_uuid;
END;
$$;


ALTER FUNCTION "public"."get_student_class_info"("student_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_messages_count"("user_uuid" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM message_recipients mr
  WHERE mr.recipient_id = user_uuid::text
    AND mr.is_read = false;
    
  RETURN COALESCE(unread_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_messages_count"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("user_id" "uuid") RETURNS TABLE("permission_name" character varying, "category" character varying, "description" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT p.name, p.category, p.description
    FROM users u
    JOIN admin_roles ar ON u.admin_role_id = ar.id
    JOIN role_permissions rp ON ar.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = user_id 
    AND u.is_active = true
    ORDER BY p.category, p.name;
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_preschool_info"("user_auth_id" "uuid") RETURNS TABLE("preschool_id" "uuid", "role" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT u.preschool_id, u.role
  FROM public.users u
  WHERE u.auth_user_id = user_auth_id
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_user_preschool_info"("user_auth_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_tenant_id"("user_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    tenant_id UUID;
BEGIN
    SELECT preschool_id INTO tenant_id 
    FROM users 
    WHERE auth_user_id = user_uuid;
    
    RETURN tenant_id;
END;
$$;


ALTER FUNCTION "public"."get_user_tenant_id"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Avoid duplicates if rerun
  if exists (select 1 from public.users where auth_user_id = new.id) then
    return new;
  end if;

  insert into public.users (
    auth_user_id,
    email,
    name,
    role,
    preschool_id,
    is_active
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''),'@',1), 'User'),
    coalesce((new.raw_user_meta_data->>'role')::text, 'parent'),
    null,
    true
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_auth_user"() IS 'Bootstrap a public.users row for each auth.users record; safe server-side profile creation.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    invitation_record RECORD;
    preschool_id_val UUID;
BEGIN
    -- Get user data from metadata
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'parent');
    preschool_id_val := NULL;
    
    -- Check if user has invitation code
    IF NEW.raw_user_meta_data->>'invitationCode' IS NOT NULL THEN
        -- Get invitation details
        SELECT ic.preschool_id, ic.role 
        INTO preschool_id_val, user_role
        FROM invitation_codes ic 
        WHERE ic.code = NEW.raw_user_meta_data->>'invitationCode'
        AND ic.email = NEW.email
        AND ic.expires_at > NOW()
        AND ic.used_at IS NULL;
        
        -- Mark invitation as used
        UPDATE invitation_codes 
        SET used_at = NOW(), used_by = NEW.id::TEXT 
        WHERE code = NEW.raw_user_meta_data->>'invitationCode'
        AND email = NEW.email;
    END IF;
    
    -- Check if user has school code (for parents)
    IF NEW.raw_user_meta_data->>'schoolCode' IS NOT NULL AND preschool_id_val IS NULL THEN
        -- Look up preschool by school code (you might need to implement this)
        -- For now, we'll leave preschool_id as NULL for independent users
        NULL;
    END IF;
    
    -- Insert user profile
    INSERT INTO public.users (
        auth_user_id,
        email,
        name,
        role,
        preschool_id,
        is_active,
        profile_completion_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        preschool_id_val,
        true,
        'incomplete',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the auth signup
        RAISE WARNING 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_class_enrollment"("class_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE classes 
    SET current_enrollment = current_enrollment + 1 
    WHERE id = class_id_param;
END;
$$;


ALTER FUNCTION "public"."increment_class_enrollment"("class_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_preschool_admin"("user_auth_id" "uuid", "target_preschool_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_info RECORD;
BEGIN
  SELECT * INTO user_info FROM get_user_preschool_info(user_auth_id);
  
  RETURN (
    user_info.preschool_id = target_preschool_id AND 
    user_info.role IN ('admin', 'principal', 'preschool_admin')
  );
END;
$$;


ALTER FUNCTION "public"."is_preschool_admin"("user_auth_id" "uuid", "target_preschool_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.users where auth_user_id = auth.uid() and role = 'superadmin'
  );
$$;


ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_class_enrollment"("class_id_param" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE classes 
    SET current_enrollment = (
        SELECT COUNT(*) 
        FROM students 
        WHERE class_id = class_id_param AND is_active = true
    )
    WHERE id = class_id_param;
END;
$$;


ALTER FUNCTION "public"."recalculate_class_enrollment"("class_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."redeem_invitation_code"("p_code" "text", "p_name" "text" DEFAULT NULL::"text", "p_phone" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_auth_uid uuid;
  v_inv record;
  v_user_id uuid;
  v_email text;
  v_role text;
  v_preschool_id uuid;
begin
  -- Get current authenticated user
  v_auth_uid := auth.uid();
  if v_auth_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Fetch the invitation code (must be unused and not expired)
  select ic.* into v_inv
  from public.invitation_codes ic
  where ic.code = p_code
    and ic.used_at is null
    and ic.expires_at > now()
  limit 1;

  if not found then
    raise exception 'invalid_or_expired_code';
  end if;

  -- Derive fields
  v_email := v_inv.email;
  v_role := coalesce(v_inv.role, 'parent');
  v_preschool_id := v_inv.preschool_id;

  -- Upsert user profile
  insert into public.users as u (
    auth_user_id,
    email,
    name,
    role,
    preschool_id,
    is_active,
    phone
  ) values (
    v_auth_uid,
    v_email,
    coalesce(p_name, split_part(coalesce(v_email,''),'@',1), 'User'),
    v_role,
    v_preschool_id,
    true,
    p_phone
  )
  on conflict (auth_user_id) do update set
    email = excluded.email,
    name = coalesce(excluded.name, u.name),
    role = excluded.role,
    preschool_id = excluded.preschool_id,
    is_active = true,
    phone = coalesce(excluded.phone, u.phone)
  returning id into v_user_id;

  -- Mark invitation as used
  update public.invitation_codes
  set used_at = now(),
      used_by = v_auth_uid
  where id = v_inv.id;

  return v_user_id;
end;
$$;


ALTER FUNCTION "public"."redeem_invitation_code"("p_code" "text", "p_name" "text", "p_phone" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."redeem_invitation_code"("p_code" "text", "p_name" "text", "p_phone" "text") IS 'Redeems invitation code and bootstraps/updates user profile securely.';



CREATE OR REPLACE FUNCTION "public"."register_student_with_code"("p_code" character varying, "p_parent_id" "uuid", "p_student_first_name" character varying, "p_student_last_name" character varying, "p_date_of_birth" "date", "p_age_group_id" "uuid", "p_allergies" "text" DEFAULT NULL::"text", "p_special_needs" "text" DEFAULT NULL::"text", "p_emergency_contact_name" character varying DEFAULT NULL::character varying, "p_emergency_contact_phone" character varying DEFAULT NULL::character varying) RETURNS TABLE("success" boolean, "message" "text", "student_id" "uuid", "registration_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  invitation_record RECORD;
  new_student_id UUID;
  new_registration_id UUID;
BEGIN
  -- Validate the invitation code
  SELECT * INTO invitation_record 
  FROM validate_school_invitation_code(p_code);
  
  IF NOT invitation_record.is_valid THEN
    RETURN QUERY SELECT false, 'Invalid or expired invitation code', NULL::UUID, NULL::UUID;
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
    allergies,
    special_needs,
    emergency_contact_name,
    emergency_contact_phone
  ) VALUES (
    invitation_record.preschool_id,
    p_student_first_name,
    p_student_last_name,
    p_date_of_birth,
    p_age_group_id,
    p_parent_id,
    p_allergies,
    p_special_needs,
    p_emergency_contact_name,
    p_emergency_contact_phone
  ) RETURNING id INTO new_student_id;
  
  -- Create registration record
  INSERT INTO student_registrations (
    student_id,
    preschool_id,
    registered_by
  ) VALUES (
    new_student_id,
    invitation_record.preschool_id,
    p_parent_id
  ) RETURNING id INTO new_registration_id;
  
  -- Use the invitation code
  PERFORM use_school_invitation_code(p_code, 
    (SELECT email FROM users WHERE id = p_parent_id),
    p_student_first_name || ' ' || p_student_last_name
  );
  
  RETURN QUERY SELECT true, 'Student registered successfully', new_student_id, new_registration_id;
END;
$$;


ALTER FUNCTION "public"."register_student_with_code"("p_code" character varying, "p_parent_id" "uuid", "p_student_first_name" character varying, "p_student_last_name" character varying, "p_date_of_birth" "date", "p_age_group_id" "uuid", "p_allergies" "text", "p_special_needs" "text", "p_emergency_contact_name" character varying, "p_emergency_contact_phone" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_student_age"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
    begin
      new.age := date_part('year', age(current_date, new.date_of_birth))::int;
      return new;
    end;
    $$;


ALTER FUNCTION "public"."set_student_age"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class_enrollment_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_class_enrollment_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- This would be called when someone rates content
    -- Implementation depends on how you want to handle content ratings
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_content_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_teacher_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE independent_teacher_profiles 
        SET average_rating = (
            SELECT AVG(rating) FROM teacher_reviews WHERE teacher_id = NEW.teacher_id
        ),
        total_reviews = (
            SELECT COUNT(*) FROM teacher_reviews WHERE teacher_id = NEW.teacher_id
        )
        WHERE user_id = NEW.teacher_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE independent_teacher_profiles 
        SET average_rating = (
            SELECT AVG(rating) FROM teacher_reviews WHERE teacher_id = NEW.teacher_id
        ),
        total_reviews = (
            SELECT COUNT(*) FROM teacher_reviews WHERE teacher_id = NEW.teacher_id
        )
        WHERE user_id = NEW.teacher_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE independent_teacher_profiles 
        SET average_rating = (
            SELECT COALESCE(AVG(rating), 0) FROM teacher_reviews WHERE teacher_id = OLD.teacher_id
        ),
        total_reviews = (
            SELECT COUNT(*) FROM teacher_reviews WHERE teacher_id = OLD.teacher_id
        )
        WHERE user_id = OLD.teacher_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_teacher_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_teacher_student_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.connection_status = 'active' THEN
        UPDATE independent_teacher_profiles 
        SET current_students_count = current_students_count + 1
        WHERE user_id = NEW.teacher_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.connection_status != 'active' AND NEW.connection_status = 'active' THEN
            UPDATE independent_teacher_profiles 
            SET current_students_count = current_students_count + 1
            WHERE user_id = NEW.teacher_id;
        ELSIF OLD.connection_status = 'active' AND NEW.connection_status != 'active' THEN
            UPDATE independent_teacher_profiles 
            SET current_students_count = current_students_count - 1
            WHERE user_id = NEW.teacher_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.connection_status = 'active' THEN
        UPDATE independent_teacher_profiles 
        SET current_students_count = current_students_count - 1
        WHERE user_id = OLD.teacher_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_teacher_student_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_invitation RECORD;
  v_user_id uuid;
BEGIN
  -- Get invitation details
  SELECT * INTO v_invitation
  FROM public.invitation_codes
  WHERE code = p_code
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;
  
  -- Create user record
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    phone,
    role,
    preschool_id,
    is_active
  ) VALUES (
    p_auth_user_id,
    v_invitation.email,
    p_name,
    p_phone,
    v_invitation.role,
    v_invitation.preschool_id,
    true
  ) RETURNING id INTO v_user_id;
  
  -- Mark invitation as used
  UPDATE public.invitation_codes
  SET used_at = now(), used_by = p_auth_user_id
  WHERE id = v_invitation.id;
  
  RETURN v_user_id;
END;
$$;


ALTER FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."use_school_invitation_code"("code_param" character varying, "parent_email_param" character varying, "child_name_param" character varying) RETURNS TABLE("success" boolean, "message" "text", "preschool_id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  invitation_record RECORD;
  new_use_id UUID;
BEGIN
  -- Validate the code first
  SELECT * INTO invitation_record 
  FROM validate_school_invitation_code(code_param);
  
  IF NOT invitation_record.is_valid THEN
    RETURN QUERY SELECT false, 'Invalid or expired invitation code', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create invitation use record
  INSERT INTO invitation_uses (
    invitation_code_id,
    parent_email,
    child_name,
    status
  ) VALUES (
    invitation_record.id,
    parent_email_param,
    child_name_param,
    'pending'
  ) RETURNING id INTO new_use_id;
  
  -- Update usage count
  UPDATE school_invitation_codes 
  SET usage_count = usage_count + 1
  WHERE id = invitation_record.id;
  
  RETURN QUERY SELECT true, 'Invitation code used successfully', invitation_record.preschool_id;
END;
$$;


ALTER FUNCTION "public"."use_school_invitation_code"("code_param" character varying, "parent_email_param" character varying, "child_name_param" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission_name" character varying) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users u
        JOIN admin_roles ar ON u.admin_role_id = ar.id
        JOIN role_permissions rp ON ar.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = user_id 
        AND p.name = permission_name
        AND u.is_active = true
    );
END;
$$;


ALTER FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission_name" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_invitation_code"("p_code" "text", "p_email" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_invitation record;
  v_parent_code record;
BEGIN
  -- First try teacher/admin invitations
  SELECT * INTO v_invitation
  FROM public.school_invitation_codes
  WHERE code = p_code 
    AND invited_email = p_email
    AND is_active = true
    AND expires_at > now()
    AND current_uses < max_uses;
    
  IF FOUND THEN
    RETURN json_build_object(
      'valid', true,
      'type', 'teacher',
      'preschool_id', v_invitation.preschool_id,
      'invitation_type', v_invitation.invitation_type
    );
  END IF;
  
  -- Try parent access codes
  SELECT * INTO v_parent_code
  FROM public.parent_access_codes
  WHERE code = p_code 
    AND parent_email = p_email
    AND is_active = true
    AND expires_at > now()
    AND used_at IS NULL;
    
  IF FOUND THEN
    RETURN json_build_object(
      'valid', true,
      'type', 'parent',
      'preschool_id', v_parent_code.preschool_id,
      'student_id', v_parent_code.student_id,
      'student_name', v_parent_code.student_name
    );
  END IF;
  
  RETURN json_build_object('valid', false, 'message', 'Invalid or expired invitation code');
END;
$$;


ALTER FUNCTION "public"."validate_invitation_code"("p_code" "text", "p_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_parent_code"("p_code" character varying) RETURNS TABLE("id" "uuid", "preschool_id" "uuid", "student_name" character varying, "parent_email" character varying, "expires_at" timestamp with time zone, "is_valid" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pac.id,
        pac.preschool_id,
        pac.student_name,
        pac.parent_email,
        pac.expires_at,
        (pac.status = 'active' AND pac.expires_at > NOW() AND pac.usage_count < pac.max_usage) as is_valid
    FROM parent_access_codes pac
    WHERE pac.code = p_code;
END;
$$;


ALTER FUNCTION "public"."validate_parent_code"("p_code" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_school_invitation_code"("invitation_code" character varying) RETURNS TABLE("is_valid" boolean, "preschool_id" "uuid", "preschool_name" character varying, "tenant_slug" character varying, "expires_at" timestamp with time zone, "id" "uuid")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (sic.is_active = true AND sic.expires_at > NOW() AND 
     (sic.max_uses IS NULL OR sic.usage_count < sic.max_uses)) as is_valid,
    sic.preschool_id,
    p.name as preschool_name,
    NULL as tenant_slug,
    sic.expires_at,
    sic.id
  FROM school_invitation_codes sic
  JOIN preschools p ON sic.preschool_id = p.id
  WHERE sic.code = invitation_code;
END;
$$;


ALTER FUNCTION "public"."validate_school_invitation_code"("invitation_code" character varying) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "preschool_id" "uuid",
    "avatar_url" "text",
    "phone" "text",
    "is_active" boolean DEFAULT true,
    "auth_user_id" "uuid",
    "home_address" "text",
    "home_city" "text",
    "home_postal_code" "text",
    "work_company" "text",
    "work_position" "text",
    "work_address" "text",
    "work_phone" "text",
    "emergency_contact_1_name" "text",
    "emergency_contact_1_phone" "text",
    "emergency_contact_1_relationship" "text",
    "emergency_contact_2_name" "text",
    "emergency_contact_2_phone" "text",
    "emergency_contact_2_relationship" "text",
    "relationship_to_child" "text",
    "pickup_authorized" "text",
    "profile_completed_at" timestamp with time zone,
    "profile_completion_status" "text" DEFAULT 'incomplete'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    CONSTRAINT "users_profile_completion_status_check" CHECK (("profile_completion_status" = ANY (ARRAY['incomplete'::"text", 'in_progress'::"text", 'complete'::"text"]))),
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['superadmin'::"text", 'preschool_admin'::"text", 'teacher'::"text", 'parent'::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."__v_current_user" AS
 SELECT "id" AS "user_id",
    "preschool_id"
   FROM "public"."users"
  WHERE ("auth_user_id" = "auth"."uid"());


ALTER VIEW "public"."__v_current_user" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "activity_type" character varying(50) NOT NULL,
    "instructions" "text",
    "estimated_time" integer,
    "materials" "text",
    "sequence_order" integer DEFAULT 1
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."addresses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address_type" character varying(20) NOT NULL,
    "street_address" "text" NOT NULL,
    "city" character varying(100) NOT NULL,
    "state" character varying(100),
    "postal_code" character varying(20),
    "country" character varying(100) DEFAULT 'United States'::character varying,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "addresses_address_type_check" CHECK ((("address_type")::"text" = ANY ((ARRAY['home'::character varying, 'work'::character varying, 'billing'::character varying, 'emergency'::character varying])::"text"[])))
);


ALTER TABLE "public"."addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."age_groups" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "min_age" integer DEFAULT 0,
    "max_age" integer DEFAULT 5,
    "min_age_months" integer,
    "max_age_months" integer,
    "description" "text",
    "preschool_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."age_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "priority" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assessments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid",
    "class_id" "uuid",
    "student_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "assessment_type" "text",
    "score" numeric,
    "grade" "text",
    "skills_assessed" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."assessments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homework_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lesson_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "instructions" "text",
    "materials_needed" "text",
    "estimated_time_minutes" integer DEFAULT 30,
    "due_date_offset_days" integer DEFAULT 7 NOT NULL,
    "difficulty_level" integer DEFAULT 1,
    "is_required" boolean DEFAULT true,
    "class_id" "uuid",
    "teacher_id" "uuid" NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "homework_assignments_difficulty_level_check" CHECK ((("difficulty_level" >= 1) AND ("difficulty_level" <= 5)))
);


ALTER TABLE "public"."homework_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."assignments" WITH ("security_invoker"='on') AS
 SELECT "id",
    "class_id",
    "title",
    "description",
    "due_date_offset_days" AS "due_date",
    "created_at"
   FROM "public"."homework_assignments";


ALTER VIEW "public"."assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."class_assignments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "assigned_date" "date" DEFAULT CURRENT_DATE,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "start_date" "date" DEFAULT CURRENT_DATE,
    "end_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "class_assignments_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'transferred'::character varying])::"text"[])))
);


ALTER TABLE "public"."class_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "age_group_id" "uuid" NOT NULL,
    "teacher_id" "uuid",
    "max_capacity" integer DEFAULT 15,
    "current_enrollment" integer DEFAULT 0,
    "room_number" character varying(50),
    "icon_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "grade_level" "text",
    "age_min" integer,
    "age_max" integer,
    "description" "text"
);


ALTER TABLE "public"."classes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classroom_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "class_id" "uuid",
    "report_type" "text" NOT NULL,
    "report_date" "date" NOT NULL,
    "activities_summary" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "total_activities" integer DEFAULT 0 NOT NULL,
    "behavior_notes" "text",
    "mood_rating" integer,
    "participation_level" "text",
    "social_interactions" "text",
    "learning_highlights" "text",
    "skills_developed" "text"[],
    "areas_for_improvement" "text",
    "achievement_badges" "text"[],
    "meals_eaten" "text"[],
    "nap_time_start" timestamp with time zone,
    "nap_time_end" timestamp with time zone,
    "diaper_changes" integer,
    "bathroom_visits" integer,
    "health_observations" "text",
    "incidents" "text",
    "medications_given" "text"[],
    "temperature_checks" "jsonb",
    "parent_message" "text",
    "follow_up_needed" boolean,
    "next_steps" "text",
    "media_highlights" "text"[],
    "photo_count" integer,
    "is_sent_to_parents" boolean DEFAULT false NOT NULL,
    "sent_at" timestamp with time zone,
    "parent_viewed_at" timestamp with time zone,
    "parent_acknowledgment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "classroom_reports_participation_level_check" CHECK (("participation_level" = ANY (ARRAY['low'::"text", 'moderate'::"text", 'high'::"text", 'excellent'::"text"]))),
    CONSTRAINT "classroom_reports_report_type_check" CHECK (("report_type" = ANY (ARRAY['daily'::"text", 'weekly'::"text", 'monthly'::"text"])))
);


ALTER TABLE "public"."classroom_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."emergency_contacts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "student_id" "uuid" NOT NULL,
    "name" character varying(255) NOT NULL,
    "relationship" character varying(100) NOT NULL,
    "phone" character varying(20) NOT NULL,
    "email" character varying(255),
    "address" "text",
    "is_primary" boolean DEFAULT false,
    "can_pickup" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."emergency_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "event_date" "date" NOT NULL,
    "event_time" "text",
    "event_type" "text",
    "location" "text",
    "is_mandatory" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."homework_submissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "homework_assignment_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "submission_text" "text",
    "attachment_urls" "text"[] DEFAULT '{}'::"text"[],
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'submitted'::"text",
    "teacher_feedback" "text",
    "grade" "text",
    "graded_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "homework_submissions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'submitted'::"text", 'reviewed'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."homework_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_children" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "date_of_birth" "date" NOT NULL,
    "age" integer NOT NULL,
    "learning_level" "text" NOT NULL,
    "interests" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "learning_goals" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "special_needs" "text",
    "connected_teacher_id" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "current_skills" "jsonb" DEFAULT '{}'::"jsonb",
    "completed_activities_count" integer DEFAULT 0,
    "total_learning_hours" numeric(10,2) DEFAULT 0.00,
    "emergency_contact" "jsonb",
    "medical_info" "text",
    "allergies" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."independent_children" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_content_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "creator_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "content_type" "text" NOT NULL,
    "age_groups" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "subjects" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "skills" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "difficulty_level" "text" DEFAULT 'age_appropriate'::"text",
    "estimated_time_minutes" integer,
    "materials_needed" "text",
    "instructions" "text",
    "content_url" "text",
    "thumbnail_url" "text",
    "downloadable_resources" "jsonb" DEFAULT '[]'::"jsonb",
    "views_count" integer DEFAULT 0,
    "downloads_count" integer DEFAULT 0,
    "average_rating" numeric(3,2) DEFAULT 0.00,
    "is_public" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "moderation_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "independent_content_library_content_type_check" CHECK (("content_type" = ANY (ARRAY['activity'::"text", 'lesson'::"text", 'worksheet'::"text", 'game'::"text", 'video'::"text", 'story'::"text"]))),
    CONSTRAINT "independent_content_library_creator_type_check" CHECK (("creator_type" = ANY (ARRAY['teacher'::"text", 'parent'::"text", 'admin'::"text"]))),
    CONSTRAINT "independent_content_library_moderation_status_check" CHECK (("moderation_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."independent_content_library" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_homework_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "instructions" "text" NOT NULL,
    "materials_needed" "text",
    "due_date_offset_days" integer DEFAULT 7 NOT NULL,
    "estimated_time_minutes" integer,
    "assignment_type" "text" DEFAULT 'independent_teacher'::"text" NOT NULL,
    "skills_to_assess" "text"[] DEFAULT '{}'::"text"[],
    "difficulty_level" "text" DEFAULT 'age_appropriate'::"text",
    "learning_objectives" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true NOT NULL,
    "assigned_date" timestamp with time zone DEFAULT "now"(),
    "completed_date" timestamp with time zone,
    "grade_received" "text",
    "feedback" "text",
    "ai_generated" boolean DEFAULT false,
    "personalization_factors" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."independent_homework_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_learning_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "child_id" "uuid" NOT NULL,
    "skill_name" "text" NOT NULL,
    "skill_category" "text" NOT NULL,
    "current_level" "text" DEFAULT 'beginner'::"text" NOT NULL,
    "target_level" "text" DEFAULT 'proficient'::"text" NOT NULL,
    "progress_percentage" integer DEFAULT 0,
    "last_assessment_date" timestamp with time zone,
    "last_assessment_score" integer,
    "improvement_rate" numeric(5,2),
    "total_activities_completed" integer DEFAULT 0,
    "total_time_spent_minutes" integer DEFAULT 0,
    "streak_days" integer DEFAULT 0,
    "longest_streak_days" integer DEFAULT 0,
    "next_milestone" "text",
    "milestone_target_date" "date",
    "parent_notes" "text",
    "teacher_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "independent_learning_progress_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100)))
);


ALTER TABLE "public"."independent_learning_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "notification_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "is_sent" boolean DEFAULT false,
    "delivery_method" "text"[] DEFAULT '{app}'::"text"[],
    "send_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "independent_notifications_notification_type_check" CHECK (("notification_type" = ANY (ARRAY['connection_request'::"text", 'connection_accepted'::"text", 'connection_declined'::"text", 'new_assignment'::"text", 'assignment_completed'::"text", 'session_reminder'::"text", 'payment_due'::"text", 'progress_update'::"text", 'achievement_unlocked'::"text"])))
);


ALTER TABLE "public"."independent_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_parent_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "children_count" integer DEFAULT 1 NOT NULL,
    "home_school_setup" boolean DEFAULT false NOT NULL,
    "learning_goals" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "contact_preferences" "jsonb" DEFAULT '{"sms": false, "email": true, "app_notifications": true}'::"jsonb" NOT NULL,
    "looking_for_teacher" boolean DEFAULT false NOT NULL,
    "preferred_teaching_style" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "budget_range" "text",
    "city" "text",
    "state" "text",
    "country" "text" DEFAULT 'United States'::"text",
    "max_distance_miles" integer DEFAULT 25,
    "online_learning_preferred" boolean DEFAULT true,
    "preferred_communication_hours" "jsonb" DEFAULT '{"end": "17:00", "start": "09:00"}'::"jsonb",
    "languages_spoken" "text"[] DEFAULT '{English}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."independent_parent_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "scheduled_start" timestamp with time zone NOT NULL,
    "scheduled_end" timestamp with time zone NOT NULL,
    "actual_start" timestamp with time zone,
    "actual_end" timestamp with time zone,
    "session_type" "text" DEFAULT 'regular'::"text",
    "session_status" "text" DEFAULT 'scheduled'::"text",
    "lesson_plan" "text",
    "activities_completed" "text"[],
    "skills_practiced" "text"[],
    "teacher_notes" "text",
    "parent_notes" "text",
    "homework_assigned" boolean DEFAULT false,
    "child_engagement_level" integer,
    "learning_objectives_met" integer,
    "areas_of_strength" "text"[],
    "areas_for_improvement" "text"[],
    "meeting_url" "text",
    "recording_url" "text",
    "technical_issues" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "independent_sessions_child_engagement_level_check" CHECK ((("child_engagement_level" >= 1) AND ("child_engagement_level" <= 5))),
    CONSTRAINT "independent_sessions_session_status_check" CHECK (("session_status" = ANY (ARRAY['scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text"]))),
    CONSTRAINT "independent_sessions_session_type_check" CHECK (("session_type" = ANY (ARRAY['regular'::"text", 'makeup'::"text", 'assessment'::"text", 'trial'::"text"])))
);


ALTER TABLE "public"."independent_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."independent_teacher_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "teaching_specialties" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "experience_years" integer DEFAULT 0 NOT NULL,
    "bio" "text" NOT NULL,
    "profile_image_url" "text",
    "virtual_classroom_name" "text" NOT NULL,
    "contact_email" "text" NOT NULL,
    "available_for_connections" boolean DEFAULT true NOT NULL,
    "max_students" integer DEFAULT 20 NOT NULL,
    "current_students_count" integer DEFAULT 0 NOT NULL,
    "teaching_philosophy" "text" NOT NULL,
    "city" "text",
    "state" "text",
    "country" "text" DEFAULT 'United States'::"text",
    "timezone" "text" DEFAULT 'America/New_York'::"text",
    "hourly_rate_min" numeric(10,2),
    "hourly_rate_max" numeric(10,2),
    "available_hours" "jsonb" DEFAULT '{"friday": [], "monday": [], "sunday": [], "tuesday": [], "saturday": [], "thursday": [], "wednesday": []}'::"jsonb",
    "average_rating" numeric(3,2) DEFAULT 0.00,
    "total_reviews" integer DEFAULT 0,
    "is_verified" boolean DEFAULT false,
    "verification_date" timestamp with time zone,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."independent_teacher_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "email" "text" NOT NULL,
    "role" "text" NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "invitation_codes_role_check" CHECK (("role" = ANY (ARRAY['teacher'::"text", 'parent'::"text"])))
);


ALTER TABLE "public"."invitation_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."learning_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid",
    "student_id" "uuid",
    "activity_type" "text",
    "title" "text",
    "description" "text",
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."learning_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "description" "text",
    "icon" character varying(50),
    "icon_name" character varying(50),
    "color" character varying(7),
    "color_theme" character varying(7)
);


ALTER TABLE "public"."lesson_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "content" "text",
    "category_id" "uuid" NOT NULL,
    "age_group_id" "uuid" NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "difficulty_level" integer DEFAULT 1,
    "materials_needed" "text",
    "learning_objectives" "text",
    "is_public" boolean DEFAULT false,
    "is_published" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "tier" character varying(20) DEFAULT 'free'::character varying,
    "has_video" boolean DEFAULT false,
    "has_interactive" boolean DEFAULT false,
    "has_printables" boolean DEFAULT false,
    "stem_concepts" "text"[],
    "home_extension" "text"[],
    "preschool_id" "uuid",
    "created_by" "uuid",
    "thumbnail_url" "text",
    "video_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lessons_difficulty_level_check" CHECK ((("difficulty_level" >= 1) AND ("difficulty_level" <= 5)))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_uploads" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "uploaded_by" "uuid" NOT NULL,
    "file_name" character varying(255) NOT NULL,
    "file_type" character varying(50) NOT NULL,
    "file_size" bigint NOT NULL,
    "file_path" "text" NOT NULL,
    "file_url" "text" NOT NULL,
    "mime_type" character varying(100),
    "alt_text" "text",
    "is_public" boolean DEFAULT false,
    "folder" character varying(100) DEFAULT 'general'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."media_uploads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_drafts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" character varying(50) NOT NULL,
    "recipient_data" "jsonb",
    "attachment_urls" "text"[],
    "scheduled_send_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "author_id" "uuid",
    CONSTRAINT "message_drafts_message_type_check" CHECK ((("message_type")::"text" = ANY ((ARRAY['direct'::character varying, 'announcement'::character varying, 'system'::character varying, 'homework_discussion'::character varying])::"text"[])))
);


ALTER TABLE "public"."message_drafts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message_id" "uuid" NOT NULL,
    "notification_type" character varying(30) DEFAULT 'message'::character varying,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "message_notifications_notification_type_check" CHECK ((("notification_type")::"text" = ANY ((ARRAY['message'::character varying, 'announcement'::character varying, 'emergency'::character varying, 'reminder'::character varying])::"text"[])))
);


ALTER TABLE "public"."message_notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_participants" (
    "thread_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "last_read_at" timestamp with time zone,
    "is_muted" boolean DEFAULT false
);


ALTER TABLE "public"."message_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_recipients" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "recipient_type" character varying(20) DEFAULT 'user'::character varying,
    "read_at" timestamp with time zone,
    "status" character varying(20) DEFAULT 'sent'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_archived" boolean DEFAULT false,
    "archived_at" timestamp with time zone,
    CONSTRAINT "message_recipients_recipient_type_check" CHECK ((("recipient_type")::"text" = ANY ((ARRAY['user'::character varying, 'class'::character varying, 'role'::character varying])::"text"[]))),
    CONSTRAINT "message_recipients_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['sent'::character varying, 'delivered'::character varying, 'read'::character varying, 'failed'::character varying])::"text"[])))
);


ALTER TABLE "public"."message_recipients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."message_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "participants" "uuid"[] DEFAULT '{}'::"uuid"[] NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "student_id" "uuid",
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."message_threads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "subject" character varying(255) NOT NULL,
    "content" "text" NOT NULL,
    "message_type" character varying(20) DEFAULT 'general'::character varying,
    "priority" character varying(10) DEFAULT 'normal'::character varying,
    "is_draft" boolean DEFAULT false,
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "preview" "text",
    CONSTRAINT "messages_message_type_check" CHECK ((("message_type")::"text" = ANY ((ARRAY['general'::character varying, 'announcement'::character varying, 'emergency'::character varying, 'homework'::character varying, 'event'::character varying])::"text"[]))),
    CONSTRAINT "messages_priority_check" CHECK ((("priority")::"text" = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::"text"[])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message_id" "uuid",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."parent_access_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "code" character varying(20) NOT NULL,
    "parent_email" character varying(255) NOT NULL,
    "student_name" character varying(255) NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval) NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."parent_access_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_fees" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "fee_type" character varying(30) NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "description" "text" NOT NULL,
    "due_date" "date" NOT NULL,
    "recurring_type" character varying(20),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "title" "text",
    "is_overdue" boolean DEFAULT false,
    "is_paid" boolean DEFAULT false,
    CONSTRAINT "payment_fees_fee_type_check" CHECK ((("fee_type")::"text" = ANY ((ARRAY['tuition'::character varying, 'registration'::character varying, 'activity'::character varying, 'lunch'::character varying, 'late_pickup'::character varying, 'supplies'::character varying])::"text"[]))),
    CONSTRAINT "payment_fees_recurring_type_check" CHECK ((("recurring_type")::"text" = ANY ((ARRAY['none'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::"text"[]))),
    CONSTRAINT "payment_fees_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'overdue'::character varying, 'waived'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_fees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "method_type" character varying(20) NOT NULL,
    "provider" character varying(50) NOT NULL,
    "provider_payment_method_id" character varying(255),
    "is_default" boolean DEFAULT false,
    "last_four" character varying(4),
    "expiry_month" integer,
    "expiry_year" integer,
    "cardholder_name" character varying(255),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payment_methods_method_type_check" CHECK ((("method_type")::"text" = ANY ((ARRAY['card'::character varying, 'bank'::character varying, 'paypal'::character varying, 'stripe'::character varying])::"text"[])))
);


ALTER TABLE "public"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_methods_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid",
    "user_id" "uuid",
    "display_name" "text" NOT NULL,
    "is_enabled" boolean DEFAULT true,
    "is_default" boolean DEFAULT false,
    "config" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_methods_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_receipts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "receipt_number" character varying(100) NOT NULL,
    "receipt_url" "text",
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "issued_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_receipts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "payer_id" "uuid" NOT NULL,
    "payment_fee_id" "uuid" NOT NULL,
    "payment_method_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "payment_status" character varying(20) DEFAULT 'pending'::character varying,
    "payment_intent_id" character varying(255),
    "transaction_id" character varying(255),
    "payment_date" timestamp with time zone,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text",
    "paid_at" timestamp with time zone,
    "due_date" "date",
    CONSTRAINT "payments_payment_status_check" CHECK ((("payment_status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'completed'::character varying, 'failed'::character varying, 'refunded'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."personal_learning_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "child_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "instructions" "text" NOT NULL,
    "materials_needed" "text",
    "estimated_time_minutes" integer,
    "skills_to_assess" "text"[] DEFAULT '{}'::"text"[],
    "activity_type" "text" DEFAULT 'parent_created'::"text" NOT NULL,
    "difficulty_level" "text" DEFAULT 'age_appropriate'::"text",
    "indoor_outdoor" "text" DEFAULT 'indoor'::"text",
    "group_individual" "text" DEFAULT 'individual'::"text",
    "is_active" boolean DEFAULT true NOT NULL,
    "completed_date" timestamp with time zone,
    "child_rating" integer,
    "parent_notes" "text",
    "ai_generated" boolean DEFAULT false,
    "personalization_prompt" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."personal_learning_activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preschool_onboarding_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_name" character varying(255) NOT NULL,
    "admin_name" character varying(255) NOT NULL,
    "admin_email" character varying(255) NOT NULL,
    "phone" character varying(20),
    "address" "text",
    "number_of_students" integer,
    "number_of_teachers" integer,
    "message" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "preschool_onboarding_requests_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."preschool_onboarding_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preschools" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "address" "text",
    "phone" character varying(20),
    "email" character varying(255) NOT NULL,
    "logo_url" "text",
    "subscription_plan" character varying(20) DEFAULT 'trial'::character varying,
    "subscription_status" character varying(20) DEFAULT 'pending'::character varying,
    "subscription_start_date" "date",
    "subscription_end_date" "date",
    "billing_email" character varying(255),
    "max_students" integer DEFAULT 50,
    "max_teachers" integer DEFAULT 10,
    "onboarding_status" character varying(20) DEFAULT 'requested'::character varying,
    "setup_completed" boolean DEFAULT false,
    "tenant_slug" character varying(50),
    "domain" character varying(100),
    "timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "preschools_onboarding_status_check" CHECK ((("onboarding_status")::"text" = ANY ((ARRAY['requested'::character varying, 'approved'::character varying, 'setup'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "preschools_subscription_plan_check" CHECK ((("subscription_plan")::"text" = ANY ((ARRAY['trial'::character varying, 'basic'::character varying, 'premium'::character varying])::"text"[]))),
    CONSTRAINT "preschools_subscription_status_check" CHECK ((("subscription_status")::"text" = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'cancelled'::character varying])::"text"[])))
);


ALTER TABLE "public"."preschools" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."school_invitation_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "code" character varying(50) NOT NULL,
    "invitation_type" character varying(20) DEFAULT 'teacher'::character varying,
    "invited_email" character varying(255) NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "used_at" timestamp with time zone,
    "used_by" "uuid",
    "max_uses" integer DEFAULT 1,
    "current_uses" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "school_invitation_codes_invitation_type_check" CHECK ((("invitation_type")::"text" = ANY ((ARRAY['teacher'::character varying, 'parent'::character varying, 'admin'::character varying])::"text"[])))
);


ALTER TABLE "public"."school_invitation_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."student_registrations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "student_first_name" character varying(255) NOT NULL,
    "student_last_name" character varying(255) NOT NULL,
    "date_of_birth" "date" NOT NULL,
    "age_group_id" "uuid" NOT NULL,
    "parent_email" character varying(255) NOT NULL,
    "parent_phone" character varying(20),
    "allergies" "text",
    "special_needs" "text",
    "emergency_contact_name" character varying(255),
    "emergency_contact_phone" character varying(20),
    "registration_code" character varying(50),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "student_registrations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::"text"[])))
);


ALTER TABLE "public"."student_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "class_id" "uuid",
    "first_name" character varying(255) NOT NULL,
    "last_name" character varying(255) NOT NULL,
    "nickname" character varying(100),
    "date_of_birth" "date" NOT NULL,
    "sex" character varying(20),
    "gender" character varying(20),
    "age_group_id" "uuid" NOT NULL,
    "parent_id" "uuid",
    "emergency_contact_name" character varying(255),
    "emergency_contact_phone" character varying(20),
    "emergency_contact_relation" character varying(100),
    "allergies" "text",
    "special_needs" "text",
    "medical_conditions" "text",
    "medications" "text",
    "dietary_restrictions" "text",
    "home_language" character varying(100),
    "home_address" "text",
    "previous_preschool" character varying(255),
    "previous_experience" "text",
    "previous_school_experience" "text",
    "enrollment_date" "date" DEFAULT CURRENT_DATE,
    "attendance_days" "text"[],
    "time_block" character varying(100),
    "registration_fee" character varying(50),
    "payment_method" character varying(50),
    "consent_policies" boolean DEFAULT true,
    "consent_media" boolean DEFAULT true,
    "consent_field_trips" boolean DEFAULT true,
    "consent_photography" boolean DEFAULT true,
    "document_uploads" "jsonb" DEFAULT '[]'::"jsonb",
    "additional_notes" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "full_name" "text" GENERATED ALWAYS AS (((("first_name")::"text" || ' '::"text") || ("last_name")::"text")) STORED,
    "age" integer,
    "avatar_url" "text"
);


ALTER TABLE "public"."students" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "subject" "text" NOT NULL,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "log_type" "text",
    "severity" "text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "invitation_code" "text" NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "accepted_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    CONSTRAINT "teacher_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."teacher_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "connection_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "review_text" "text",
    "strengths" "text"[] DEFAULT '{}'::"text"[],
    "areas_for_improvement" "text"[] DEFAULT '{}'::"text"[],
    "would_recommend" boolean,
    "verified_review" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."teacher_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teacher_student_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "student_id" "uuid" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "connection_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "start_date" timestamp with time zone,
    "end_date" timestamp with time zone,
    "notes" "text",
    "parent_message" "text",
    "teacher_response" "text",
    "sessions_per_week" integer DEFAULT 1,
    "session_duration_minutes" integer DEFAULT 30,
    "preferred_days" "text"[] DEFAULT '{}'::"text"[],
    "preferred_times" "jsonb" DEFAULT '{}'::"jsonb",
    "agreed_rate" numeric(10,2),
    "payment_schedule" "text" DEFAULT 'weekly'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "teacher_student_connections_connection_status_check" CHECK (("connection_status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'paused'::"text", 'ended'::"text"])))
);


ALTER TABLE "public"."teacher_student_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preference_key" character varying(100) NOT NULL,
    "preference_value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."video_call_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preschool_id" "uuid" NOT NULL,
    "host_id" "uuid" NOT NULL,
    "status" "text",
    "started_at" timestamp with time zone,
    "ended_at" timestamp with time zone,
    "joined_participants" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."video_call_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."virtual_classrooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "subject_areas" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "age_groups" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "max_capacity" integer DEFAULT 20 NOT NULL,
    "current_enrollment" integer DEFAULT 0 NOT NULL,
    "is_accepting_students" boolean DEFAULT true NOT NULL,
    "schedule_description" "text" DEFAULT 'Flexible scheduling available'::"text" NOT NULL,
    "meeting_url" "text",
    "classroom_rules" "jsonb" DEFAULT '[]'::"jsonb",
    "required_materials" "text",
    "learning_objectives" "text",
    "price_per_session" numeric(10,2),
    "price_per_month" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."virtual_classrooms" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."addresses"
    ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."age_groups"
    ADD CONSTRAINT "age_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_student_id_class_id_key" UNIQUE ("student_id", "class_id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classroom_reports"
    ADD CONSTRAINT "classroom_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."emergency_contacts"
    ADD CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_children"
    ADD CONSTRAINT "independent_children_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_content_library"
    ADD CONSTRAINT "independent_content_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_homework_assignments"
    ADD CONSTRAINT "independent_homework_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_learning_progress"
    ADD CONSTRAINT "independent_learning_progress_child_id_skill_name_key" UNIQUE ("child_id", "skill_name");



ALTER TABLE ONLY "public"."independent_learning_progress"
    ADD CONSTRAINT "independent_learning_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_notifications"
    ADD CONSTRAINT "independent_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_parent_profiles"
    ADD CONSTRAINT "independent_parent_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_sessions"
    ADD CONSTRAINT "independent_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."independent_teacher_profiles"
    ADD CONSTRAINT "independent_teacher_profiles_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."message_notifications"
    ADD CONSTRAINT "message_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_participants"
    ADD CONSTRAINT "message_participants_pkey" PRIMARY KEY ("thread_id", "user_id");



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_message_id_recipient_id_key" UNIQUE ("message_id", "recipient_id");



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."message_threads"
    ADD CONSTRAINT "message_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_fees"
    ADD CONSTRAINT "payment_fees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods_config"
    ADD CONSTRAINT "payment_methods_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_receipt_number_key" UNIQUE ("receipt_number");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."personal_learning_activities"
    ADD CONSTRAINT "personal_learning_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preschool_onboarding_requests"
    ADD CONSTRAINT "preschool_onboarding_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preschools"
    ADD CONSTRAINT "preschools_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."preschools"
    ADD CONSTRAINT "preschools_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preschools"
    ADD CONSTRAINT "preschools_tenant_slug_key" UNIQUE ("tenant_slug");



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_registrations"
    ADD CONSTRAINT "student_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."student_registrations"
    ADD CONSTRAINT "student_registrations_registration_code_key" UNIQUE ("registration_code");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_logs"
    ADD CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_connection_id_key" UNIQUE ("connection_id");



ALTER TABLE ONLY "public"."teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_student_connections"
    ADD CONSTRAINT "teacher_student_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teacher_student_connections"
    ADD CONSTRAINT "teacher_student_connections_teacher_id_student_id_key" UNIQUE ("teacher_id", "student_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_preference_key_key" UNIQUE ("user_id", "preference_key");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."video_call_sessions"
    ADD CONSTRAINT "video_call_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."virtual_classrooms"
    ADD CONSTRAINT "virtual_classrooms_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_addresses_user_id" ON "public"."addresses" USING "btree" ("user_id");



CREATE INDEX "idx_class_assignments_class_id" ON "public"."class_assignments" USING "btree" ("class_id");



CREATE INDEX "idx_class_assignments_student_id" ON "public"."class_assignments" USING "btree" ("student_id");



CREATE INDEX "idx_classes_preschool_id" ON "public"."classes" USING "btree" ("preschool_id");



CREATE INDEX "idx_classes_teacher_id" ON "public"."classes" USING "btree" ("teacher_id");



CREATE INDEX "idx_content_library_age_groups" ON "public"."independent_content_library" USING "gin" ("age_groups");



CREATE INDEX "idx_content_library_creator" ON "public"."independent_content_library" USING "btree" ("created_by");



CREATE INDEX "idx_content_library_public" ON "public"."independent_content_library" USING "btree" ("is_public");



CREATE INDEX "idx_emergency_contacts_student_id" ON "public"."emergency_contacts" USING "btree" ("student_id");



CREATE INDEX "idx_homework_assignments_active" ON "public"."homework_assignments" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_homework_assignments_class" ON "public"."homework_assignments" USING "btree" ("class_id");



CREATE INDEX "idx_homework_assignments_preschool" ON "public"."homework_assignments" USING "btree" ("preschool_id");



CREATE INDEX "idx_homework_assignments_teacher" ON "public"."homework_assignments" USING "btree" ("teacher_id");



CREATE INDEX "idx_homework_submissions_assignment" ON "public"."homework_submissions" USING "btree" ("homework_assignment_id");



CREATE INDEX "idx_homework_submissions_parent" ON "public"."homework_submissions" USING "btree" ("parent_id");



CREATE INDEX "idx_homework_submissions_status" ON "public"."homework_submissions" USING "btree" ("status");



CREATE INDEX "idx_homework_submissions_student" ON "public"."homework_submissions" USING "btree" ("student_id");



CREATE INDEX "idx_homework_submissions_submitted_at" ON "public"."homework_submissions" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_independent_children_active" ON "public"."independent_children" USING "btree" ("is_active");



CREATE INDEX "idx_independent_children_parent_id" ON "public"."independent_children" USING "btree" ("parent_id");



CREATE INDEX "idx_independent_homework_active" ON "public"."independent_homework_assignments" USING "btree" ("is_active");



CREATE INDEX "idx_independent_homework_student_id" ON "public"."independent_homework_assignments" USING "btree" ("student_id");



CREATE INDEX "idx_independent_homework_teacher_id" ON "public"."independent_homework_assignments" USING "btree" ("teacher_id");



CREATE INDEX "idx_independent_notifications_recipient" ON "public"."independent_notifications" USING "btree" ("recipient_id");



CREATE INDEX "idx_independent_notifications_unread" ON "public"."independent_notifications" USING "btree" ("recipient_id", "is_read");



CREATE INDEX "idx_independent_parent_profiles_looking" ON "public"."independent_parent_profiles" USING "btree" ("looking_for_teacher");



CREATE INDEX "idx_independent_parent_profiles_user_id" ON "public"."independent_parent_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_independent_sessions_connection" ON "public"."independent_sessions" USING "btree" ("connection_id");



CREATE INDEX "idx_independent_sessions_scheduled" ON "public"."independent_sessions" USING "btree" ("scheduled_start");



CREATE INDEX "idx_independent_sessions_teacher" ON "public"."independent_sessions" USING "btree" ("teacher_id");



CREATE INDEX "idx_independent_teacher_profiles_available" ON "public"."independent_teacher_profiles" USING "btree" ("available_for_connections");



CREATE INDEX "idx_independent_teacher_profiles_location" ON "public"."independent_teacher_profiles" USING "btree" ("city", "state");



CREATE INDEX "idx_independent_teacher_profiles_specialties" ON "public"."independent_teacher_profiles" USING "gin" ("teaching_specialties");



CREATE INDEX "idx_independent_teacher_profiles_user_id" ON "public"."independent_teacher_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_learning_progress_child_id" ON "public"."independent_learning_progress" USING "btree" ("child_id");



CREATE INDEX "idx_learning_progress_skill" ON "public"."independent_learning_progress" USING "btree" ("skill_name");



CREATE INDEX "idx_lessons_category_age" ON "public"."lessons" USING "btree" ("category_id", "age_group_id");



CREATE INDEX "idx_lessons_public" ON "public"."lessons" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_message_recipients_message_id" ON "public"."message_recipients" USING "btree" ("message_id");



CREATE INDEX "idx_message_recipients_recipient_id" ON "public"."message_recipients" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_preschool_id" ON "public"."messages" USING "btree" ("preschool_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_onboarding_requests_email" ON "public"."preschool_onboarding_requests" USING "btree" ("admin_email");



CREATE INDEX "idx_onboarding_requests_status" ON "public"."preschool_onboarding_requests" USING "btree" ("status");



CREATE INDEX "idx_parent_access_codes_code" ON "public"."parent_access_codes" USING "btree" ("code");



CREATE INDEX "idx_payment_fees_student_id" ON "public"."payment_fees" USING "btree" ("student_id");



CREATE INDEX "idx_payments_preschool_id" ON "public"."payments" USING "btree" ("preschool_id");



CREATE INDEX "idx_personal_activities_child_id" ON "public"."personal_learning_activities" USING "btree" ("child_id");



CREATE INDEX "idx_personal_activities_parent_id" ON "public"."personal_learning_activities" USING "btree" ("parent_id");



CREATE INDEX "idx_school_invitation_codes_code" ON "public"."school_invitation_codes" USING "btree" ("code");



CREATE INDEX "idx_student_registrations_preschool_id" ON "public"."student_registrations" USING "btree" ("preschool_id");



CREATE INDEX "idx_students_class_id" ON "public"."students" USING "btree" ("class_id");



CREATE INDEX "idx_students_parent_id" ON "public"."students" USING "btree" ("parent_id");



CREATE INDEX "idx_students_preschool_id" ON "public"."students" USING "btree" ("preschool_id");



CREATE INDEX "idx_teacher_invitations_email" ON "public"."teacher_invitations" USING "btree" ("email");



CREATE INDEX "idx_teacher_invitations_preschool" ON "public"."teacher_invitations" USING "btree" ("preschool_id");



CREATE INDEX "idx_teacher_invitations_status" ON "public"."teacher_invitations" USING "btree" ("status");



CREATE INDEX "idx_teacher_student_connections_parent_id" ON "public"."teacher_student_connections" USING "btree" ("parent_id");



CREATE INDEX "idx_teacher_student_connections_status" ON "public"."teacher_student_connections" USING "btree" ("connection_status");



CREATE INDEX "idx_teacher_student_connections_student_id" ON "public"."teacher_student_connections" USING "btree" ("student_id");



CREATE INDEX "idx_teacher_student_connections_teacher_id" ON "public"."teacher_student_connections" USING "btree" ("teacher_id");



CREATE INDEX "idx_users_auth_user_id" ON "public"."users" USING "btree" ("auth_user_id");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_preschool_id" ON "public"."users" USING "btree" ("preschool_id");



CREATE INDEX "idx_users_role" ON "public"."users" USING "btree" ("role");



CREATE INDEX "idx_virtual_classrooms_accepting" ON "public"."virtual_classrooms" USING "btree" ("is_accepting_students");



CREATE INDEX "idx_virtual_classrooms_teacher_id" ON "public"."virtual_classrooms" USING "btree" ("teacher_id");



CREATE INDEX "invitation_codes_code_idx" ON "public"."invitation_codes" USING "btree" ("code");



CREATE INDEX "invitation_codes_email_idx" ON "public"."invitation_codes" USING "btree" ("email");



CREATE INDEX "invitation_codes_preschool_id_idx" ON "public"."invitation_codes" USING "btree" ("preschool_id");



CREATE OR REPLACE TRIGGER "trg_set_student_age_ins" BEFORE INSERT ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."set_student_age"();



CREATE OR REPLACE TRIGGER "trg_set_student_age_upd" BEFORE UPDATE OF "date_of_birth" ON "public"."students" FOR EACH ROW EXECUTE FUNCTION "public"."set_student_age"();



CREATE OR REPLACE TRIGGER "trigger_update_teacher_rating" AFTER INSERT OR DELETE OR UPDATE ON "public"."teacher_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_teacher_rating"();



CREATE OR REPLACE TRIGGER "trigger_update_teacher_student_count" AFTER INSERT OR DELETE OR UPDATE ON "public"."teacher_student_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_teacher_student_count"();



CREATE OR REPLACE TRIGGER "update_independent_children_updated_at" BEFORE UPDATE ON "public"."independent_children" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_content_library_updated_at" BEFORE UPDATE ON "public"."independent_content_library" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_homework_assignments_updated_at" BEFORE UPDATE ON "public"."independent_homework_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_learning_progress_updated_at" BEFORE UPDATE ON "public"."independent_learning_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_notifications_updated_at" BEFORE UPDATE ON "public"."independent_notifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_parent_profiles_updated_at" BEFORE UPDATE ON "public"."independent_parent_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_sessions_updated_at" BEFORE UPDATE ON "public"."independent_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_independent_teacher_profiles_updated_at" BEFORE UPDATE ON "public"."independent_teacher_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_personal_learning_activities_updated_at" BEFORE UPDATE ON "public"."personal_learning_activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teacher_reviews_updated_at" BEFORE UPDATE ON "public"."teacher_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_teacher_student_connections_updated_at" BEFORE UPDATE ON "public"."teacher_student_connections" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_virtual_classrooms_updated_at" BEFORE UPDATE ON "public"."virtual_classrooms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."age_groups"
    ADD CONSTRAINT "age_groups_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id");



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assessments"
    ADD CONSTRAINT "assessments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."class_assignments"
    ADD CONSTRAINT "class_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_age_group_id_fkey" FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id");



ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classroom_reports"
    ADD CONSTRAINT "classroom_reports_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."classroom_reports"
    ADD CONSTRAINT "classroom_reports_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classroom_reports"
    ADD CONSTRAINT "classroom_reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classroom_reports"
    ADD CONSTRAINT "classroom_reports_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."emergency_contacts"
    ADD CONSTRAINT "emergency_contacts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_drafts"
    ADD CONSTRAINT "fk_message_drafts_preschool" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."homework_assignments"
    ADD CONSTRAINT "homework_assignments_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_homework_assignment_id_fkey" FOREIGN KEY ("homework_assignment_id") REFERENCES "public"."homework_assignments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."homework_submissions"
    ADD CONSTRAINT "homework_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_children"
    ADD CONSTRAINT "independent_children_connected_teacher_id_fkey" FOREIGN KEY ("connected_teacher_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."independent_children"
    ADD CONSTRAINT "independent_children_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_content_library"
    ADD CONSTRAINT "independent_content_library_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_homework_assignments"
    ADD CONSTRAINT "independent_homework_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."independent_children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_homework_assignments"
    ADD CONSTRAINT "independent_homework_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_learning_progress"
    ADD CONSTRAINT "independent_learning_progress_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."independent_children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_notifications"
    ADD CONSTRAINT "independent_notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_notifications"
    ADD CONSTRAINT "independent_notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_parent_profiles"
    ADD CONSTRAINT "independent_parent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_sessions"
    ADD CONSTRAINT "independent_sessions_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."teacher_student_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_sessions"
    ADD CONSTRAINT "independent_sessions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_sessions"
    ADD CONSTRAINT "independent_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."independent_children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_sessions"
    ADD CONSTRAINT "independent_sessions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."independent_teacher_profiles"
    ADD CONSTRAINT "independent_teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_codes"
    ADD CONSTRAINT "invitation_codes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_activities"
    ADD CONSTRAINT "learning_activities_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."learning_activities"
    ADD CONSTRAINT "learning_activities_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_age_group_id_fkey" FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."lesson_categories"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id");



ALTER TABLE ONLY "public"."media_uploads"
    ADD CONSTRAINT "media_uploads_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_notifications"
    ADD CONSTRAINT "message_notifications_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_participants"
    ADD CONSTRAINT "message_participants_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."message_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_participants"
    ADD CONSTRAINT "message_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_recipients"
    ADD CONSTRAINT "message_recipients_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_threads"
    ADD CONSTRAINT "message_threads_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."message_threads"
    ADD CONSTRAINT "message_threads_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."parent_access_codes"
    ADD CONSTRAINT "parent_access_codes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_fees"
    ADD CONSTRAINT "payment_fees_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_fees"
    ADD CONSTRAINT "payment_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_methods_config"
    ADD CONSTRAINT "payment_methods_config_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_methods_config"
    ADD CONSTRAINT "payment_methods_config_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_receipts"
    ADD CONSTRAINT "payment_receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_fee_id_fkey" FOREIGN KEY ("payment_fee_id") REFERENCES "public"."payment_fees"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_learning_activities"
    ADD CONSTRAINT "personal_learning_activities_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "public"."independent_children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."personal_learning_activities"
    ADD CONSTRAINT "personal_learning_activities_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."preschool_onboarding_requests"
    ADD CONSTRAINT "preschool_onboarding_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."school_invitation_codes"
    ADD CONSTRAINT "school_invitation_codes_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."student_registrations"
    ADD CONSTRAINT "student_registrations_age_group_id_fkey" FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id");



ALTER TABLE ONLY "public"."student_registrations"
    ADD CONSTRAINT "student_registrations_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_age_group_id_fkey" FOREIGN KEY ("age_group_id") REFERENCES "public"."age_groups"("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id");



ALTER TABLE ONLY "public"."students"
    ADD CONSTRAINT "students_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."teacher_invitations"
    ADD CONSTRAINT "teacher_invitations_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "public"."teacher_student_connections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."independent_children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_reviews"
    ADD CONSTRAINT "teacher_reviews_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_student_connections"
    ADD CONSTRAINT "teacher_student_connections_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_student_connections"
    ADD CONSTRAINT "teacher_student_connections_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "public"."independent_children"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teacher_student_connections"
    ADD CONSTRAINT "teacher_student_connections_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_call_sessions"
    ADD CONSTRAINT "video_call_sessions_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."video_call_sessions"
    ADD CONSTRAINT "video_call_sessions_preschool_id_fkey" FOREIGN KEY ("preschool_id") REFERENCES "public"."preschools"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."virtual_classrooms"
    ADD CONSTRAINT "virtual_classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Connected teachers can view children" ON "public"."independent_children" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."teacher_student_connections"
  WHERE (("teacher_student_connections"."student_id" = "independent_children"."id") AND ("teacher_student_connections"."teacher_id" = "auth"."uid"()) AND ("teacher_student_connections"."connection_status" = 'active'::"text")))));



CREATE POLICY "Parents can manage child progress" ON "public"."independent_learning_progress" USING ((EXISTS ( SELECT 1
   FROM "public"."independent_children"
  WHERE (("independent_children"."id" = "independent_learning_progress"."child_id") AND ("independent_children"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Parents can manage own activities" ON "public"."personal_learning_activities" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can manage own children" ON "public"."independent_children" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can manage own profile" ON "public"."independent_parent_profiles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Parents can manage own reviews" ON "public"."teacher_reviews" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can manage their children's connections" ON "public"."teacher_student_connections" USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can view child assignments" ON "public"."independent_homework_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."independent_children"
  WHERE (("independent_children"."id" = "independent_homework_assignments"."student_id") AND ("independent_children"."parent_id" = "auth"."uid"())))));



CREATE POLICY "Parents can view child sessions" ON "public"."independent_sessions" FOR SELECT USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Prevent profile deletions" ON "public"."users" FOR DELETE USING (false);



CREATE POLICY "Public can view accepting classrooms" ON "public"."virtual_classrooms" FOR SELECT USING (("is_accepting_students" = true));



CREATE POLICY "Public can view approved content" ON "public"."independent_content_library" FOR SELECT USING ((("is_public" = true) AND ("moderation_status" = 'approved'::"text")));



CREATE POLICY "Public can view available teachers" ON "public"."independent_teacher_profiles" FOR SELECT USING (("available_for_connections" = true));



CREATE POLICY "Public can view verified reviews" ON "public"."teacher_reviews" FOR SELECT USING (("verified_review" = true));



CREATE POLICY "Superadmins can update onboarding requests" ON "public"."preschool_onboarding_requests" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "Superadmins can view all onboarding requests" ON "public"."preschool_onboarding_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."auth_user_id" = "auth"."uid"()) AND ("users"."role" = 'superadmin'::"text")))));



CREATE POLICY "Teachers can manage assignments" ON "public"."independent_homework_assignments" USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "Teachers can manage own classrooms" ON "public"."virtual_classrooms" USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "Teachers can manage own profile" ON "public"."independent_teacher_profiles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Teachers can manage their connections" ON "public"."teacher_student_connections" USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "Teachers can manage their sessions" ON "public"."independent_sessions" USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "Teachers can view connected student progress" ON "public"."independent_learning_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."teacher_student_connections" "tsc"
     JOIN "public"."independent_children" "ic" ON (("ic"."id" = "tsc"."student_id")))
  WHERE (("ic"."id" = "independent_learning_progress"."child_id") AND ("tsc"."teacher_id" = "auth"."uid"()) AND ("tsc"."connection_status" = 'active'::"text")))));



CREATE POLICY "Teachers can view own reviews" ON "public"."teacher_reviews" FOR SELECT USING (("auth"."uid"() = "teacher_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK ((("auth"."uid"() = "auth_user_id") AND ("profile_completion_status" = 'incomplete'::"text")));



CREATE POLICY "Users can manage own content" ON "public"."independent_content_library" USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can manage own notifications" ON "public"."independent_notifications" USING (("auth"."uid"() = "recipient_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING ((("auth"."uid"() = "auth_user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text"))) WITH CHECK ((("auth"."uid"() = "auth_user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "auth_user_id") OR (("auth"."jwt"() ->> 'role'::"text") = 'admin'::"text")));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_accessible" ON "public"."activities" FOR SELECT TO "authenticated" USING (("lesson_id" IN ( SELECT "lessons"."id"
   FROM "public"."lessons"
  WHERE (("lessons"."is_public" = true) OR ("lessons"."preschool_id" IS NULL) OR "public"."can_access_preschool"("lessons"."preschool_id")))));



ALTER TABLE "public"."addresses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "addresses_own" ON "public"."addresses" TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "admins_can_create_invitations" ON "public"."invitation_codes" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_preschool_admin"("auth"."uid"(), "preschool_id") OR (EXISTS ( SELECT 1
   FROM "public"."get_user_preschool_info"("auth"."uid"()) "p"("preschool_id", "role")
  WHERE ("p"."role" = 'superadmin'::"text")))));



CREATE POLICY "admins_can_delete_unused_invitations" ON "public"."invitation_codes" FOR DELETE TO "authenticated" USING ((("used_at" IS NULL) AND ("public"."is_preschool_admin"("auth"."uid"(), "preschool_id") OR (EXISTS ( SELECT 1
   FROM "public"."get_user_preschool_info"("auth"."uid"()) "p"("preschool_id", "role")
  WHERE ("p"."role" = 'superadmin'::"text"))))));



CREATE POLICY "admins_can_view_preschool_invitations" ON "public"."invitation_codes" FOR SELECT TO "authenticated" USING (("public"."is_preschool_admin"("auth"."uid"(), "preschool_id") OR ("invited_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."get_user_preschool_info"("auth"."uid"()) "p"("preschool_id", "role")
  WHERE ("p"."role" = 'superadmin'::"text")))));



ALTER TABLE "public"."age_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone_can_view_invitation_by_code" ON "public"."invitation_codes" FOR SELECT USING (true);



ALTER TABLE "public"."assessments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."class_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "classes_preschool_access" ON "public"."classes" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



CREATE POLICY "classes_write_same_school" ON "public"."classes" USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"())))) WITH CHECK (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



ALTER TABLE "public"."classroom_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."emergency_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "emergency_contacts_preschool" ON "public"."emergency_contacts" FOR SELECT TO "authenticated" USING (("student_id" IN ( SELECT "students"."id"
   FROM "public"."students"
  WHERE "public"."can_access_preschool"("students"."preschool_id"))));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."homework_assignments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "homework_preschool" ON "public"."homework_assignments" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



ALTER TABLE "public"."homework_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "homework_submissions_own" ON "public"."homework_submissions" FOR SELECT TO "authenticated" USING ((("student_id" IN ( SELECT "s"."id"
   FROM "public"."students" "s"
  WHERE ("s"."parent_id" IN ( SELECT "users"."id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))) OR "public"."can_access_preschool"(( SELECT "s"."preschool_id"
   FROM "public"."students" "s"
  WHERE ("s"."id" = "homework_submissions"."student_id")))));



ALTER TABLE "public"."independent_children" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_content_library" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_homework_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_learning_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_parent_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."independent_teacher_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitation_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."learning_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lesson_categories_policy" ON "public"."lesson_categories" USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "lessons_preschool" ON "public"."lessons" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



CREATE POLICY "lessons_public" ON "public"."lessons" FOR SELECT TO "authenticated" USING ((("is_public" = true) OR ("preschool_id" IS NULL)));



CREATE POLICY "manage_own" ON "public"."user_preferences" USING ((EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "user_preferences"."user_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "user_preferences"."user_id"))));



CREATE POLICY "manage_own_drafts" ON "public"."message_drafts" USING ((EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "message_drafts"."author_id")))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "message_drafts"."author_id"))));



ALTER TABLE "public"."media_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_drafts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."message_recipients" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "message_recipients_own" ON "public"."message_recipients" FOR SELECT TO "authenticated" USING (("recipient_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."message_threads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete_sender" ON "public"."messages" FOR DELETE USING (("public"."is_superadmin"() OR ("sender_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"())))));



CREATE POLICY "messages_insert_sender" ON "public"."messages" FOR INSERT WITH CHECK (("public"."is_superadmin"() OR (("sender_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND ("preschool_id" = ANY ("public"."current_user_preschool_ids"())))));



CREATE POLICY "messages_preschool" ON "public"."messages" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



CREATE POLICY "messages_update_sender" ON "public"."messages" FOR UPDATE USING (("public"."is_superadmin"() OR ("sender_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))))) WITH CHECK (("public"."is_superadmin"() OR ("sender_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"())))));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."parent_access_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "parents_create_own_payments" ON "public"."payments" FOR INSERT TO "authenticated" WITH CHECK (("payer_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "parents_own_students" ON "public"."students" FOR SELECT TO "authenticated" USING (("parent_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "parents_read_own_payments" ON "public"."payments" FOR SELECT TO "authenticated" USING (("payer_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."payment_fees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_fees_preschool" ON "public"."payment_fees" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



ALTER TABLE "public"."payment_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_methods_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "payment_methods_own" ON "public"."payment_methods" TO "authenticated" USING (("user_id" IN ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



ALTER TABLE "public"."payment_receipts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."personal_learning_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preschool_onboarding_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preschools" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "preschools_own_access" ON "public"."preschools" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("id"));



ALTER TABLE "public"."school_invitation_codes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "school_staff_manage_preschool_payments" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['admin'::"text", 'principal'::"text", 'teacher'::"text"])) AND ("u"."preschool_id" = "payments"."preschool_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['admin'::"text", 'principal'::"text", 'teacher'::"text"])) AND ("u"."preschool_id" = "payments"."preschool_id")))));



CREATE POLICY "sel_admin_same_school" ON "public"."school_invitation_codes" FOR SELECT USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "school_invitation_codes"."preschool_id") AND ("u"."role" = ANY (ARRAY['admin'::"text", 'principal'::"text", 'preschool_admin'::"text"])))))));



CREATE POLICY "sel_own" ON "public"."notifications" FOR SELECT USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "notifications"."user_id")))));



CREATE POLICY "sel_own_or_same_school" ON "public"."message_notifications" FOR SELECT USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "message_notifications"."user_id"))) OR (EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."id" = "message_notifications"."message_id") AND ("m"."preschool_id" = ANY ("public"."current_user_preschool_ids"())))))));



CREATE POLICY "sel_own_participation" ON "public"."message_participants" FOR SELECT USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "message_participants"."user_id")))));



CREATE POLICY "sel_own_preschool" ON "public"."preschools" FOR SELECT USING (("auth"."uid"() IN ( SELECT "users"."auth_user_id"
   FROM "public"."users"
  WHERE ("users"."preschool_id" = "preschools"."id"))));



CREATE POLICY "sel_participant" ON "public"."message_recipients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."messages" "m"
  WHERE (("m"."id" = "message_recipients"."message_id") AND (("m"."preschool_id" = ANY ("public"."current_user_preschool_ids"())) OR "public"."is_superadmin"())))));



CREATE POLICY "sel_participant_or_same_school" ON "public"."video_call_sessions" FOR SELECT USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."__v_current_user" "cu"
  WHERE ("cu"."user_id" = "video_call_sessions"."host_id"))) OR ((EXISTS ( SELECT 1
   FROM "information_schema"."columns"
  WHERE ((("columns"."table_schema")::"name" = 'public'::"name") AND (("columns"."table_name")::"name" = 'video_call_sessions'::"name") AND (("columns"."column_name")::"name" = 'preschool_id'::"name")))) AND ("preschool_id" = ANY ("public"."current_user_preschool_ids"())))));



CREATE POLICY "sel_same_school" ON "public"."announcements" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school" ON "public"."assessments" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school" ON "public"."classes" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school" ON "public"."classroom_reports" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school" ON "public"."events" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school" ON "public"."homework_assignments" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school" ON "public"."homework_submissions" FOR SELECT USING (("homework_assignment_id" IN ( SELECT "ha"."id"
   FROM "public"."homework_assignments" "ha"
  WHERE ("ha"."preschool_id" IN ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "sel_same_school" ON "public"."learning_activities" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school" ON "public"."media_uploads" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school" ON "public"."parent_access_codes" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school" ON "public"."payment_fees" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school" ON "public"."payment_receipts" FOR SELECT USING (("payment_id" IN ( SELECT "p"."id"
   FROM "public"."payments" "p"
  WHERE ("p"."preschool_id" IN ( SELECT "users"."preschool_id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"()))))));



CREATE POLICY "sel_same_school" ON "public"."payments" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school" ON "public"."student_registrations" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school" ON "public"."students" FOR SELECT USING (("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))));



CREATE POLICY "sel_same_school_or_global" ON "public"."age_groups" FOR SELECT USING (("public"."is_superadmin"() OR ("preschool_id" IS NULL) OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school_or_self" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "auth_user_id") OR "public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "sel_same_school_participant" ON "public"."messages" FOR SELECT USING ((("preschool_id" IN ( SELECT "users"."preschool_id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) AND (("sender_id" = ( SELECT "users"."id"
   FROM "public"."users"
  WHERE ("users"."auth_user_id" = "auth"."uid"()))) OR (EXISTS ( SELECT 1
   FROM "public"."message_recipients" "mr"
  WHERE ((("mr"."message_id")::"text" = ("messages"."id")::"text") AND (("mr"."recipient_id")::"text" = ( SELECT ("users"."id")::"text" AS "id"
           FROM "public"."users"
          WHERE ("users"."auth_user_id" = "auth"."uid"())))))))));



CREATE POLICY "sel_same_school_via_student" ON "public"."class_assignments" FOR SELECT USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."students" "s"
  WHERE (("s"."id" = "class_assignments"."student_id") AND ("s"."preschool_id" = ANY ("public"."current_user_preschool_ids"())))))));



CREATE POLICY "staff_manage_classes" ON "public"."classes" TO "authenticated" USING ((("public"."get_current_user_role"() = ANY (ARRAY['admin'::"text", 'principal'::"text", 'teacher'::"text"])) AND "public"."can_access_preschool"("preschool_id")));



CREATE POLICY "staff_manage_students" ON "public"."students" TO "authenticated" USING ((("public"."get_current_user_role"() = ANY (ARRAY['admin'::"text", 'principal'::"text", 'teacher'::"text"])) AND "public"."can_access_preschool"("preschool_id")));



ALTER TABLE "public"."student_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "students_preschool_access" ON "public"."students" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



CREATE POLICY "students_write_same_school" ON "public"."students" USING (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"())))) WITH CHECK (("public"."is_superadmin"() OR ("preschool_id" = ANY ("public"."current_user_preschool_ids"()))));



CREATE POLICY "superadmin_all_preschools" ON "public"."preschools" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_all_users" ON "public"."users" TO "authenticated" USING ("public"."is_superadmin"()) WITH CHECK ("public"."is_superadmin"());



CREATE POLICY "superadmin_only" ON "public"."payment_methods_config" USING ("public"."is_superadmin"());



CREATE POLICY "superadmin_only" ON "public"."support_tickets" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "superadmin_only" ON "public"."system_logs" FOR SELECT USING ("public"."is_superadmin"());



CREATE POLICY "superadmins_manage_all_payments" ON "public"."payments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = 'superadmin'::"text")))));



ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."teacher_student_connections" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_delete_teacher_invitations" ON "public"."teacher_invitations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['preschool_admin'::"text", 'superadmin'::"text"])) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id")))));



CREATE POLICY "tenant_insert_teacher_invitations" ON "public"."teacher_invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['preschool_admin'::"text", 'superadmin'::"text"])) AND ("u"."preschool_id" = "u"."preschool_id")))));



CREATE POLICY "tenant_select_teacher_invitations" ON "public"."teacher_invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['preschool_admin'::"text", 'superadmin'::"text"])) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id")))));



CREATE POLICY "tenant_update_teacher_invitations" ON "public"."teacher_invitations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['preschool_admin'::"text", 'superadmin'::"text"])) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."role" = ANY (ARRAY['preschool_admin'::"text", 'superadmin'::"text"])) AND ("u"."preschool_id" = "teacher_invitations"."preschool_id")))));



ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_own_profile" ON "public"."users" FOR SELECT TO "authenticated" USING (("auth_user_id" = "auth"."uid"()));



CREATE POLICY "users_preschool_access" ON "public"."users" FOR SELECT TO "authenticated" USING ("public"."can_access_preschool"("preschool_id"));



CREATE POLICY "users_self_delete" ON "public"."users" FOR DELETE USING ((("auth"."uid"() = "auth_user_id") OR "public"."is_superadmin"()));



CREATE POLICY "users_self_update" ON "public"."users" FOR UPDATE USING ((("auth"."uid"() = "auth_user_id") OR "public"."is_superadmin"())) WITH CHECK ((("auth"."uid"() = "auth_user_id") OR "public"."is_superadmin"()));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE TO "authenticated" USING (("auth_user_id" = "auth"."uid"())) WITH CHECK (("auth_user_id" = "auth"."uid"()));



ALTER TABLE "public"."video_call_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."virtual_classrooms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "write_admin_same_school" ON "public"."school_invitation_codes" USING (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "school_invitation_codes"."preschool_id") AND ("u"."role" = ANY (ARRAY['admin'::"text", 'principal'::"text", 'preschool_admin'::"text"]))))))) WITH CHECK (("public"."is_superadmin"() OR (EXISTS ( SELECT 1
   FROM "public"."users" "u"
  WHERE (("u"."auth_user_id" = "auth"."uid"()) AND ("u"."preschool_id" = "school_invitation_codes"."preschool_id") AND ("u"."role" = ANY (ARRAY['admin'::"text", 'principal'::"text", 'preschool_admin'::"text"])))))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."__ensure_policy"("p_schema" "text", "p_table" "text", "p_policy" "text", "p_cmd" "text", "p_using" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."__ensure_policy"("p_schema" "text", "p_table" "text", "p_policy" "text", "p_cmd" "text", "p_using" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."__ensure_policy"("p_schema" "text", "p_table" "text", "p_policy" "text", "p_cmd" "text", "p_using" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_student_age"("birth_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_student_age"("birth_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_student_age"("birth_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_access_preschool"("target_preschool_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_access_preschool"("target_preschool_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_access_preschool"("target_preschool_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_parent_invitation"("p_preschool_id" "uuid", "p_student_id" "uuid", "p_email" "text", "p_student_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_parent_invitation"("p_preschool_id" "uuid", "p_student_id" "uuid", "p_email" "text", "p_student_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_parent_invitation"("p_preschool_id" "uuid", "p_student_id" "uuid", "p_email" "text", "p_student_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_teacher_invitation"("p_preschool_id" "uuid", "p_email" "text", "p_invited_by" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_teacher_invitation"("p_preschool_id" "uuid", "p_email" "text", "p_invited_by" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_teacher_invitation"("p_preschool_id" "uuid", "p_email" "text", "p_invited_by" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_tenant_with_admin"("p_name" character varying, "p_email" character varying, "p_admin_name" character varying, "p_tenant_slug" character varying, "p_subscription_plan" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_with_admin"("p_name" character varying, "p_email" character varying, "p_admin_name" character varying, "p_tenant_slug" character varying, "p_subscription_plan" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_with_admin"("p_name" character varying, "p_email" character varying, "p_admin_name" character varying, "p_tenant_slug" character varying, "p_subscription_plan" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."current_user_preschool_ids"() TO "anon";
GRANT ALL ON FUNCTION "public"."current_user_preschool_ids"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."current_user_preschool_ids"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_class_enrollment"("class_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_class_enrollment"("class_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_class_enrollment"("class_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_code"("p_email" "text", "p_role" "text", "p_preschool_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_preschool_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_preschool_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_preschool_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_overdue_fees_count"("parent_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_overdue_fees_count"("parent_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_overdue_fees_count"("parent_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_class_info"("student_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_class_info"("student_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_class_info"("student_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_messages_count"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_messages_count"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_messages_count"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_preschool_info"("user_auth_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_preschool_info"("user_auth_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_preschool_info"("user_auth_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_tenant_id"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_tenant_id"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_class_enrollment"("class_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_class_enrollment"("class_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_class_enrollment"("class_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_preschool_admin"("user_auth_id" "uuid", "target_preschool_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_preschool_admin"("user_auth_id" "uuid", "target_preschool_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_preschool_admin"("user_auth_id" "uuid", "target_preschool_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_class_enrollment"("class_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_class_enrollment"("class_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_class_enrollment"("class_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."redeem_invitation_code"("p_code" "text", "p_name" "text", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."redeem_invitation_code"("p_code" "text", "p_name" "text", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."redeem_invitation_code"("p_code" "text", "p_name" "text", "p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."register_student_with_code"("p_code" character varying, "p_parent_id" "uuid", "p_student_first_name" character varying, "p_student_last_name" character varying, "p_date_of_birth" "date", "p_age_group_id" "uuid", "p_allergies" "text", "p_special_needs" "text", "p_emergency_contact_name" character varying, "p_emergency_contact_phone" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."register_student_with_code"("p_code" character varying, "p_parent_id" "uuid", "p_student_first_name" character varying, "p_student_last_name" character varying, "p_date_of_birth" "date", "p_age_group_id" "uuid", "p_allergies" "text", "p_special_needs" "text", "p_emergency_contact_name" character varying, "p_emergency_contact_phone" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."register_student_with_code"("p_code" character varying, "p_parent_id" "uuid", "p_student_first_name" character varying, "p_student_last_name" character varying, "p_date_of_birth" "date", "p_age_group_id" "uuid", "p_allergies" "text", "p_special_needs" "text", "p_emergency_contact_name" character varying, "p_emergency_contact_phone" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_student_age"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_student_age"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_student_age"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class_enrollment_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_class_enrollment_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class_enrollment_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_content_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_content_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_content_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_teacher_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_teacher_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_teacher_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_teacher_student_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_teacher_student_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_teacher_student_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_invitation_code"("p_code" "text", "p_auth_user_id" "uuid", "p_name" "text", "p_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."use_school_invitation_code"("code_param" character varying, "parent_email_param" character varying, "child_name_param" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."use_school_invitation_code"("code_param" character varying, "parent_email_param" character varying, "child_name_param" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_school_invitation_code"("code_param" character varying, "parent_email_param" character varying, "child_name_param" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission_name" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission_name" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_permission"("user_id" "uuid", "permission_name" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_invitation_code"("p_code" "text", "p_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_invitation_code"("p_code" "text", "p_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_invitation_code"("p_code" "text", "p_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_parent_code"("p_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_parent_code"("p_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_parent_code"("p_code" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_school_invitation_code"("invitation_code" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_school_invitation_code"("invitation_code" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_school_invitation_code"("invitation_code" character varying) TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."__v_current_user" TO "anon";
GRANT ALL ON TABLE "public"."__v_current_user" TO "authenticated";
GRANT ALL ON TABLE "public"."__v_current_user" TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."addresses" TO "anon";
GRANT ALL ON TABLE "public"."addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."addresses" TO "service_role";



GRANT ALL ON TABLE "public"."age_groups" TO "anon";
GRANT ALL ON TABLE "public"."age_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."age_groups" TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."assessments" TO "anon";
GRANT ALL ON TABLE "public"."assessments" TO "authenticated";
GRANT ALL ON TABLE "public"."assessments" TO "service_role";



GRANT ALL ON TABLE "public"."homework_assignments" TO "anon";
GRANT ALL ON TABLE "public"."homework_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."assignments" TO "anon";
GRANT ALL ON TABLE "public"."assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."assignments" TO "service_role";



GRANT ALL ON TABLE "public"."class_assignments" TO "anon";
GRANT ALL ON TABLE "public"."class_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."class_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";



GRANT ALL ON TABLE "public"."classroom_reports" TO "anon";
GRANT ALL ON TABLE "public"."classroom_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."classroom_reports" TO "service_role";



GRANT ALL ON TABLE "public"."emergency_contacts" TO "anon";
GRANT ALL ON TABLE "public"."emergency_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."emergency_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."homework_submissions" TO "anon";
GRANT ALL ON TABLE "public"."homework_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."homework_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."independent_children" TO "anon";
GRANT ALL ON TABLE "public"."independent_children" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_children" TO "service_role";



GRANT ALL ON TABLE "public"."independent_content_library" TO "anon";
GRANT ALL ON TABLE "public"."independent_content_library" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_content_library" TO "service_role";



GRANT ALL ON TABLE "public"."independent_homework_assignments" TO "anon";
GRANT ALL ON TABLE "public"."independent_homework_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_homework_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."independent_learning_progress" TO "anon";
GRANT ALL ON TABLE "public"."independent_learning_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_learning_progress" TO "service_role";



GRANT ALL ON TABLE "public"."independent_notifications" TO "anon";
GRANT ALL ON TABLE "public"."independent_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."independent_parent_profiles" TO "anon";
GRANT ALL ON TABLE "public"."independent_parent_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_parent_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."independent_sessions" TO "anon";
GRANT ALL ON TABLE "public"."independent_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."independent_teacher_profiles" TO "anon";
GRANT ALL ON TABLE "public"."independent_teacher_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."independent_teacher_profiles" TO "service_role";



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



GRANT ALL ON TABLE "public"."message_notifications" TO "anon";
GRANT ALL ON TABLE "public"."message_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."message_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."message_participants" TO "anon";
GRANT ALL ON TABLE "public"."message_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."message_participants" TO "service_role";



GRANT ALL ON TABLE "public"."message_recipients" TO "anon";
GRANT ALL ON TABLE "public"."message_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."message_recipients" TO "service_role";



GRANT ALL ON TABLE "public"."message_threads" TO "anon";
GRANT ALL ON TABLE "public"."message_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."message_threads" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."parent_access_codes" TO "anon";
GRANT ALL ON TABLE "public"."parent_access_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."parent_access_codes" TO "service_role";



GRANT ALL ON TABLE "public"."payment_fees" TO "anon";
GRANT ALL ON TABLE "public"."payment_fees" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_fees" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods" TO "service_role";



GRANT ALL ON TABLE "public"."payment_methods_config" TO "anon";
GRANT ALL ON TABLE "public"."payment_methods_config" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_methods_config" TO "service_role";



GRANT ALL ON TABLE "public"."payment_receipts" TO "anon";
GRANT ALL ON TABLE "public"."payment_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_receipts" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."personal_learning_activities" TO "anon";
GRANT ALL ON TABLE "public"."personal_learning_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."personal_learning_activities" TO "service_role";



GRANT ALL ON TABLE "public"."preschool_onboarding_requests" TO "anon";
GRANT ALL ON TABLE "public"."preschool_onboarding_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."preschool_onboarding_requests" TO "service_role";



GRANT ALL ON TABLE "public"."preschools" TO "anon";
GRANT ALL ON TABLE "public"."preschools" TO "authenticated";
GRANT ALL ON TABLE "public"."preschools" TO "service_role";



GRANT ALL ON TABLE "public"."school_invitation_codes" TO "anon";
GRANT ALL ON TABLE "public"."school_invitation_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."school_invitation_codes" TO "service_role";



GRANT ALL ON TABLE "public"."student_registrations" TO "anon";
GRANT ALL ON TABLE "public"."student_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."student_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."students" TO "anon";
GRANT ALL ON TABLE "public"."students" TO "authenticated";
GRANT ALL ON TABLE "public"."students" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."system_logs" TO "anon";
GRANT ALL ON TABLE "public"."system_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."system_logs" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_invitations" TO "anon";
GRANT ALL ON TABLE "public"."teacher_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_reviews" TO "anon";
GRANT ALL ON TABLE "public"."teacher_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."teacher_student_connections" TO "anon";
GRANT ALL ON TABLE "public"."teacher_student_connections" TO "authenticated";
GRANT ALL ON TABLE "public"."teacher_student_connections" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."video_call_sessions" TO "anon";
GRANT ALL ON TABLE "public"."video_call_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."video_call_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."virtual_classrooms" TO "anon";
GRANT ALL ON TABLE "public"."virtual_classrooms" TO "authenticated";
GRANT ALL ON TABLE "public"."virtual_classrooms" TO "service_role";



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
