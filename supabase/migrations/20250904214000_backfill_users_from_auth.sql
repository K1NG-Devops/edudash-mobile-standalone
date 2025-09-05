-- 2025-09-04: Backfill public.users from existing auth.users (dev-safe, idempotent)
-- Ensures superadmin and other accounts have profiles so RLS and admin tooling work.

-- Link any email-only profiles first
update public.users u
set auth_user_id = au.id,
    name = coalesce(u.name, coalesce(nullif(au.raw_user_meta_data->>'name',''), au.email)),
    role = coalesce(u.role, coalesce(nullif(au.raw_user_meta_data->>'role',''), 'parent')),
    preschool_id = coalesce(u.preschool_id, nullif(au.raw_user_meta_data->>'preschool_id','')::uuid),
    updated_at = now()
from auth.users au
where u.auth_user_id is null
  and lower(u.email) = lower(au.email);

-- Insert profiles for any auth users that don't have a row yet
insert into public.users (auth_user_id, email, name, role, preschool_id, is_active, created_at, updated_at)
select
  au.id,
  au.email,
  coalesce(nullif(au.raw_user_meta_data->>'name',''), au.email),
  coalesce(nullif(au.raw_user_meta_data->>'role',''), 'parent'),
  nullif(au.raw_user_meta_data->>'preschool_id','')::uuid,
  true,
  now(),
  now()
from auth.users au
left join public.users u on u.auth_user_id = au.id
where u.id is null;

