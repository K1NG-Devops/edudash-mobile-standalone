-- Bind auth.users trigger to ensure public.users bootstrap occurs
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Allow superadmins to delete onboarding requests via RLS (optional if using edge function only)
drop policy if exists "Superadmins can delete onboarding requests" on preschool_onboarding_requests;
create policy "Superadmins can delete onboarding requests" on preschool_onboarding_requests
  for delete using (
    exists (
      select 1 from users u
      where u.auth_user_id = auth.uid()
      and u.role = 'superadmin'
      and coalesce(u.is_active, true) = true
    )
  );


