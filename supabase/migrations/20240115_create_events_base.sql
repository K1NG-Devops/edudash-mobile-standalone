-- 20240115_create_events_base.sql
-- Base events table required by downstream migrations

create extension if not exists "uuid-ossp";
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.events enable row level security;
