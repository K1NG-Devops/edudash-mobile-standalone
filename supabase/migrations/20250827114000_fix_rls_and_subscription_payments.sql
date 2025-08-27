-- 2025-08-27: Ensure RLS visibility for principals and add subscription_payments table for billing history
-- Safe, idempotent migration. No destructive operations. Production-ready.

begin;

-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- 1) Create subscription_payments table if missing
create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null,
  amount numeric(10,2) not null default 0,
  currency text not null default 'ZAR',
  status text not null default 'completed' check (status in ('completed','pending','failed','refunded')),
  provider_payment_id text,
  processed_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

-- 1.a) FK so PostgREST can embed platform_subscriptions(*) from payments
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints 
    where table_name = 'subscription_payments' and constraint_name = 'subscription_payments_subscription_id_fkey'
  ) then
    alter table public.subscription_payments
      add constraint subscription_payments_subscription_id_fkey
      foreign key (subscription_id)
      references public.platform_subscriptions(id)
      on delete cascade;
  end if;
end $$;

-- 1.b) Indexes
create index if not exists idx_subscription_payments_subscription on public.subscription_payments(subscription_id);
create index if not exists idx_subscription_payments_processed_at on public.subscription_payments(processed_at);

-- 1.c) RLS and privileges
alter table public.subscription_payments enable row level security;

-- Grant basic privileges (RLS still applies)
grant select on public.subscription_payments to authenticated;

-- Select policy: users can read payments for their own subscriptions
drop policy if exists subscription_payments_select_own on public.subscription_payments;
create policy subscription_payments_select_own
  on public.subscription_payments
  for select
  to authenticated
  using (exists (
    select 1
      from public.platform_subscriptions ps
     where ps.id = subscription_payments.subscription_id
       and ps.user_id = auth.uid()
  ));

-- 2) Ensure principals can view users in their preschool (and users can view themselves)
-- Drop legacy self-only policy if present; replace with union policy below
do $$
begin
  if exists (
    select 1 from pg_policies p
     where p.schemaname = 'public'
       and p.tablename = 'users'
       and p.policyname = 'Users can view their own profile'
  ) then
    execute 'drop policy "Users can view their own profile" on public.users';
  end if;
end $$;

-- Create principal view policy if missing
do $$
begin
  if not exists (
    select 1 from pg_policies p
     where p.schemaname = 'public'
       and p.tablename = 'users'
       and p.policyname = 'Principals can view users in their preschool'
  ) then
    execute $POL$
      create policy "Principals can view users in their preschool"
      on public.users
      for select
      to authenticated
      using (
        -- Always allow each user to view their own profile
        auth.uid() = auth_user_id
        or (
          -- Principals/admins can view any user in their preschool
          preschool_id = (
            select u.preschool_id
              from public.users u
             where u.auth_user_id = auth.uid()
               and u.role in ('principal','preschool_admin','admin','superadmin')
               and coalesce(u.is_active, true) = true
          )
        )
      );
    $POL$;
  end if;
end $$;

commit;

