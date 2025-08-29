-- 2025-08-27: Enable RLS and user-scoped policies for message drafts
-- Safely idempotent: drops existing policies of the same name and recreates them.

begin;

alter table if exists public.message_drafts enable row level security;

-- Select: only the sender can read their drafts
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='message_drafts' and policyname='md_select_self'
  ) then
    execute 'drop policy md_select_self on public.message_drafts';
  end if;
end$$;

create policy md_select_self
  on public.message_drafts
  for select
  to authenticated
  using (
    sender_id = (select id from public.users where auth_user_id = auth.uid())
  );

-- Insert/Update/Delete: only the sender can manage their drafts
-- We use a single FOR ALL policy for simplicity
-- If you need finer-grained control later, split into insert/update/delete policies

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='message_drafts' and policyname='md_cud_self'
  ) then
    execute 'drop policy md_cud_self on public.message_drafts';
  end if;
end$$;

create policy md_cud_self
  on public.message_drafts
  for all
  to authenticated
  using (
    sender_id = (select id from public.users where auth_user_id = auth.uid())
  )
  with check (
    sender_id = (select id from public.users where auth_user_id = auth.uid())
  );

commit;

