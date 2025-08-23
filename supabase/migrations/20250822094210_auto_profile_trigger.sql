-- Auto-create/link profile in public.users when a new auth user is created
-- Idempotent migration: creates function and trigger

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_preschool uuid;
  v_name text;
begin
  -- Extract optional metadata (fallbacks)
  v_role := coalesce(nullif(NEW.raw_user_meta_data->>'role',''), 'parent');
  v_preschool := nullif(NEW.raw_user_meta_data->>'preschool_id','')::uuid;
  v_name := coalesce(nullif(NEW.raw_user_meta_data->>'name',''), NEW.email);

  -- Link existing email-only profile (no auth_user_id yet)
  update public.users
     set auth_user_id = NEW.id,
         name = coalesce(v_name, name),
         role = coalesce(v_role, role),
         preschool_id = coalesce(v_preschool, preschool_id),
         updated_at = now()
   where auth_user_id is null
     and lower(email) = lower(NEW.email);

  -- Insert profile if none exists for this auth user
  insert into public.users (
    auth_user_id, email, name, role, preschool_id, is_active, created_at, updated_at
  )
  select NEW.id, NEW.email, v_name, v_role, v_preschool, true, now(), now()
  where not exists (
    select 1 from public.users u where u.auth_user_id = NEW.id
  );

  return NEW;
end;
$$;

-- Create trigger on auth.users (replace if exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_created();

