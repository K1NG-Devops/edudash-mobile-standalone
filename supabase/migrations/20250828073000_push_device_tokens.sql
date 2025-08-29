-- 2025-08-28 07:30:00: Push device tokens table + RLS (renamed to unique version)
-- This duplicates 20250828_push_device_tokens.sql with a unique timestamp to avoid
-- version collision in supabase_migrations. Safe & idempotent.

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null check (platform in ('ios','android')),
  app_version text,
  project_id text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, expo_push_token)
);

create index if not exists idx_push_tokens_user on public.push_device_tokens(user_id);
create index if not exists idx_push_tokens_last_seen on public.push_device_tokens(last_seen_at desc);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

create trigger push_tokens_set_updated_at
  before update on public.push_device_tokens
  for each row execute function public.set_updated_at();

alter table public.push_device_tokens enable row level security;

-- Authenticated users can view their own device tokens
drop policy if exists push_tokens_select_self on public.push_device_tokens;
create policy push_tokens_select_self
  on public.push_device_tokens
  for select to authenticated
  using (
    user_id = (select id from public.users where auth_user_id = auth.uid())
  );

-- Insert/Upsert: only for self
drop policy if exists push_tokens_insert_self on public.push_device_tokens;
create policy push_tokens_insert_self
  on public.push_device_tokens
  for insert to authenticated
  with check (
    user_id = (select id from public.users where auth_user_id = auth.uid())
  );

-- Update: only for self
drop policy if exists push_tokens_update_self on public.push_device_tokens;
create policy push_tokens_update_self
  on public.push_device_tokens
  for update to authenticated
  using (
    user_id = (select id from public.users where auth_user_id = auth.uid())
  )
  with check (
    user_id = (select id from public.users where auth_user_id = auth.uid())
  );

-- Delete: only for self
drop policy if exists push_tokens_delete_self on public.push_device_tokens;
create policy push_tokens_delete_self
  on public.push_device_tokens
  for delete to authenticated
  using (
    user_id = (select id from public.users where auth_user_id = auth.uid())
  );

commit;

