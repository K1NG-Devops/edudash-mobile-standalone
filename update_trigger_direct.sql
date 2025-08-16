-- SQL script to update the trigger function directly in the database
-- This fixes the role assignment issue for school admin users

-- First, let's check the current CHECK constraint on the users table
-- and update it to include 'principal' role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('superadmin', 'admin', 'principal', 'preschool_admin', 'teacher', 'parent'));

-- Now update the handle_new_auth_user function to better handle role metadata
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
    -- Better role handling: check for role in metadata, then special flags, or default to parent
    case 
      when new.raw_user_meta_data->>'role' is not null then new.raw_user_meta_data->>'role'
      when new.raw_user_meta_data->>'school_admin' = 'true' then 'principal'
      when new.raw_user_meta_data->>'preschool_admin' = 'true' then 'preschool_admin'
      else 'parent'
    end,
    -- Handle preschool_id from metadata
    case 
      when new.raw_user_meta_data->>'preschool_id' is not null 
      then (new.raw_user_meta_data->>'preschool_id')::uuid
      else null
    end,
    true
  );

  return new;
end;
$$;

-- Also update the handle_new_user function to handle roles properly
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
    
    -- Better role handling: check for explicit role, special flags, or default to parent
    user_role := case 
      when NEW.raw_user_meta_data->>'role' is not null then NEW.raw_user_meta_data->>'role'
      when NEW.raw_user_meta_data->>'school_admin' = 'true' then 'principal'
      when NEW.raw_user_meta_data->>'preschool_admin' = 'true' then 'preschool_admin'
      else 'parent'
    end;
    
    -- Handle preschool_id from metadata
    preschool_id_val := case 
      when NEW.raw_user_meta_data->>'preschool_id' is not null 
      then (NEW.raw_user_meta_data->>'preschool_id')::uuid
      else null
    end;
    
    -- Check if user has invitation code (this overrides metadata roles)
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

-- Verify the changes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.users'::regclass 
AND conname LIKE '%role%';
