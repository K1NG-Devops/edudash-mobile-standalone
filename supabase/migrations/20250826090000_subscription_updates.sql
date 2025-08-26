-- 2025-08-26: Add tier/currency to subscription_plans and create platform_subscriptions with RLS
-- Requirements:
-- - Add columns tier and currency to subscription_plans
-- - Backfill tier values based on seeded plan names
-- - Create platform_subscriptions table with FK to subscription_plans(id)
-- - Add basic RLS policies for per-user access

begin;

-- Ensure required extensions
create extension if not exists pgcrypto with schema extensions;

-- 1) subscription_plans: tier and currency
alter table public.subscription_plans
  add column if not exists tier text
    check (tier in ('free','starter','premium','enterprise'))
    default 'free';

alter table public.subscription_plans
  add column if not exists currency text
    default 'ZAR';

-- Optional: updated_at for housekeeping
alter table public.subscription_plans
  add column if not exists updated_at timestamp with time zone default now();

-- Backfill tier based on name (idempotent best-effort)
update public.subscription_plans
set tier = case
  when lower(name) like 'free tier%' then 'free'
  when lower(name) like 'neural starter%' then 'starter'
  when lower(name) like 'quantum pro%' then 'premium'
  when lower(name) like 'singularity%' or lower(name) like 'enterprise%' then 'enterprise'
  else coalesce(tier, 'starter')
end,
updated_at = now()
where tier is null or tier not in ('free','starter','premium','enterprise');

-- 2) platform_subscriptions table
create table if not exists public.platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'trial'
    check (status in ('trial','active','past_due','canceled','paused','expired')),
  billing_interval text not null
    check (billing_interval in ('monthly','annual')),
  amount numeric(10,2) not null default 0,
  currency text not null default 'ZAR',
  trial_start timestamp with time zone,
  trial_end timestamp with time zone,
  current_period_start timestamp with time zone not null,
  current_period_end timestamp with time zone not null,
  payment_provider text not null
    check (payment_provider in ('paypal','stripe','payfast')),
  provider_subscription_id text,
  provider_customer_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  canceled_at timestamp with time zone,
  ended_at timestamp with time zone
);

create index if not exists idx_platform_subscriptions_user on public.platform_subscriptions(user_id);
create index if not exists idx_platform_subscriptions_plan on public.platform_subscriptions(plan_id);
create index if not exists idx_platform_subscriptions_status on public.platform_subscriptions(status);

-- 3) RLS policies
alter table public.platform_subscriptions enable row level security;

-- Allow users to read their own subscriptions
drop policy if exists platform_subscriptions_select_own on public.platform_subscriptions;
create policy platform_subscriptions_select_own
  on public.platform_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow users to insert their own subscription rows
drop policy if exists platform_subscriptions_insert_own on public.platform_subscriptions;
create policy platform_subscriptions_insert_own
  on public.platform_subscriptions
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow users to update their own subscription rows
drop policy if exists platform_subscriptions_update_own on public.platform_subscriptions;
create policy platform_subscriptions_update_own
  on public.platform_subscriptions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;

