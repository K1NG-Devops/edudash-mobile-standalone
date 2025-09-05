-- Create subscription_plans table if missing to satisfy downstream billing migrations
begin;
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Free',
  price_monthly numeric(10,2),
  price_annual numeric(10,2),
  features jsonb,
  ai_quota_monthly integer,
  max_students integer,
  max_teachers integer,
  is_active boolean default true,
  created_at timestamptz default now()
);
commit;

