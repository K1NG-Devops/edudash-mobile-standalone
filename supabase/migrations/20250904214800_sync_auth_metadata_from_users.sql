-- 2025-09-04: Sync auth.users raw_user_meta_data from public.users for superadmins (dev-safe)
-- Ensures JWT contains role/preschool_id so web routing matches production behavior.

update auth.users au
set raw_user_meta_data = coalesce(au.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object(
      'role', 'superadmin'
    )
from public.users u
where u.auth_user_id = au.id
  and u.role = 'superadmin';

