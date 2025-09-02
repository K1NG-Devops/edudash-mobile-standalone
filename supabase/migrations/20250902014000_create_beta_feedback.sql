-- 20250902014000_create_beta_feedback.sql
-- Beta feedback schema, storage, RLS, and retention

create extension if not exists pgcrypto;
create extension if not exists pgjwt;
create extension if not exists pg_trgm;

-- Helper: adjust logic to your roles
create or replace function public.app_is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_user_id = uid
      and (u.role = 'superadmin' or u.role = 'preschool_admin')
  );
$$;

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  user_id uuid references public.users(id) on delete set null,
  role text,
  persona text check (persona in ('principal','teacher','parent')),
  category text check (category in ('bug','feature','confusion','other')),
  screen text,
  description text not null,
  steps text,
  severity text check (severity in ('low','medium','high','critical')),
  consent_diagnostics boolean not null default false,
  device_info jsonb,
  app_version text,
  build_channel text,
  platform text,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_auth_user_id_idx on public.beta_feedback (auth_user_id);
create index if not exists beta_feedback_user_id_idx on public.beta_feedback (user_id);
create index if not exists beta_feedback_created_at_idx on public.beta_feedback (created_at);

create table if not exists public.beta_feedback_attachments (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.beta_feedback(id) on delete cascade,
  file_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists beta_feedback_attachments_feedback_id_idx on public.beta_feedback_attachments (feedback_id);

alter table public.beta_feedback enable row level security;
alter table public.beta_feedback_attachments enable row level security;

create policy beta_feedback_insert_auth
on public.beta_feedback
for insert
to authenticated
with check (
  auth.uid() is not null and auth.uid() = auth_user_id
);

create policy beta_feedback_select_owner_or_admin
on public.beta_feedback
for select
to authenticated
using (
  auth.uid() = auth_user_id or public.app_is_admin(auth.uid())
);

create policy beta_feedback_update_admin
on public.beta_feedback
for update
to authenticated
using (public.app_is_admin(auth.uid()))
with check (public.app_is_admin(auth.uid()));

create policy beta_feedback_delete_admin
on public.beta_feedback
for delete
to authenticated
using (public.app_is_admin(auth.uid()));

create policy beta_feedback_attachments_insert_owner_or_admin
on public.beta_feedback_attachments
for insert
to authenticated
with check (
  exists (
    select 1 from public.beta_feedback bf
    where bf.id = feedback_id and (bf.auth_user_id = auth.uid() or public.app_is_admin(auth.uid()))
  )
);

create policy beta_feedback_attachments_select_owner_or_admin
on public.beta_feedback_attachments
for select
to authenticated
using (
  exists (
    select 1 from public.beta_feedback bf
    where bf.id = feedback_id and (bf.auth_user_id = auth.uid() or public.app_is_admin(auth.uid()))
  )
);

create policy beta_feedback_attachments_update_admin
on public.beta_feedback_attachments
for update
to authenticated
using (public.app_is_admin(auth.uid()))
with check (public.app_is_admin(auth.uid()));

create policy beta_feedback_attachments_delete_admin
on public.beta_feedback_attachments
for delete
to authenticated
using (public.app_is_admin(auth.uid()));

insert into storage.buckets (id, name, public)
values ('feedback_attachments', 'feedback_attachments', false)
on conflict (id) do nothing;

create policy storage_feedback_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'feedback_attachments'
  and (right(lower(name), 4) in ('.png','.jpg') or right(lower(name), 5) = '.jpeg')
);

create policy storage_feedback_select_owner_or_admin
on storage.objects
for select
to authenticated
using (
  bucket_id = 'feedback_attachments'
);

create policy storage_feedback_delete_admin
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'feedback_attachments' and public.app_is_admin(auth.uid())
);

create extension if not exists pg_cron;
select cron.schedule(
  'beta_feedback_retention_180d',
  '0 3 * * *',
  $$
  with deleted_attachments as (
    delete from public.beta_feedback_attachments bfa
    using public.beta_feedback bf
    where bfa.feedback_id = bf.id
      and bf.created_at < now() - interval '180 days'
    returning bfa.file_path
  )
  delete from public.beta_feedback bf
  where bf.created_at < now() - interval '180 days';
  $$
);

