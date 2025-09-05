-- 2025-09-04: Create preschool_onboarding_requests if missing, with anon insert policy
-- Safe/idempotent for dev. Does not affect existing production tables.

-- Ensure uuid generator is available
create extension if not exists pgcrypto;

-- Create table if it does not exist
create table if not exists public.preschool_onboarding_requests (
  id uuid primary key default gen_random_uuid(),
  preschool_name text,
  admin_name text,
  admin_email text,
  phone text,
  address text,
  number_of_students integer,
  number_of_teachers integer,
  message text,
  notes text,
  principal_email text,
  principal_name text,
  principal_phone text,
  registration_number text,
  school_name text,
  status varchar(32) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.preschool_onboarding_requests enable row level security;

-- Allow anonymous + authenticated inserts from the public form
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'preschool_onboarding_requests'
      AND policyname = 'allow_anonymous_onboarding_requests'
  ) THEN
    EXECUTE 'CREATE POLICY "allow_anonymous_onboarding_requests" ON public.preschool_onboarding_requests AS permissive FOR INSERT TO anon, authenticated WITH CHECK (true)';
  END IF;
END $$;

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_preschool_onboarding_requests_updated_at'
  ) THEN
    EXECUTE 'create trigger set_preschool_onboarding_requests_updated_at before update on public.preschool_onboarding_requests for each row execute function public.set_updated_at();';
  END IF;
END $$;

