const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function updateTriggerFunctions() {
  try {
    console.log('🔧 [Update] Updating handle_new_auth_user function...');

    // Update handle_new_auth_user function
    const { error: authTriggerError } = await supabase.rpc('exec_sql', {
      query: `
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
            -- Better role handling: check for role in metadata, school_admin, or default to parent
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
      `
    });

    if (authTriggerError && authTriggerError.code !== 'PGRST202') {
      console.error('❌ [Update] Error updating handle_new_auth_user:', authTriggerError);
    } else if (authTriggerError && authTriggerError.code === 'PGRST202') {
      console.log('⚠️ [Update] exec_sql RPC function not available, trying alternative method...');
    } else {
      console.log('✅ [Update] handle_new_auth_user function updated successfully');
    }

    console.log('🔧 [Update] Updating handle_new_user function...');

    // Update handle_new_user function
    const { error: userTriggerError } = await supabase.rpc('exec_sql', {
      query: `
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
            
            -- Better role handling: check for explicit role, school_admin flag, or default to parent
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
      `
    });

    if (userTriggerError && userTriggerError.code !== 'PGRST202') {
      console.error('❌ [Update] Error updating handle_new_user:', userTriggerError);
    } else if (userTriggerError && userTriggerError.code === 'PGRST202') {
      console.log('⚠️ [Update] exec_sql RPC function not available for handle_new_user');
    } else {
      console.log('✅ [Update] handle_new_user function updated successfully');
    }

    console.log('🏁 [Update] Trigger function updates completed');

  } catch (error) {
    console.error('❌ [Update] Error updating trigger functions:', error);
  }
}

updateTriggerFunctions();
