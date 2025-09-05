-- 20240101_initial_core_users_preschools.sql
-- Initial core schema required by downstream migrations
-- Creates public.preschools and public.users with essential columns referenced elsewhere

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
-- Core: preschools
create table if not exists public.preschools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text,
  -- subscription fields used by functions/migrations
  subscription_plan text,
  subscription_status text,
  tenant_slug text,
  onboarding_status text default 'pending',
  setup_completed boolean default false,
  -- contact/location
  phone text,
  address text,
  timezone text default 'Africa/Johannesburg',
  -- limits
  max_students integer default 50,
  max_teachers integer default 10,
  -- timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Core: users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  role text not null check (role in ('superadmin','principal','preschool_admin','admin','teacher','parent')),
  auth_user_id uuid unique,
  preschool_id uuid references public.preschools(id) on delete set null,
  is_active boolean default true,
  profile_completion_status text default 'incomplete' check (profile_completion_status in ('incomplete','in_progress','complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
