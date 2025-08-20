-- Enable RLS and add scoped policies for school_invitation_codes
-- Idempotent and safe to re-run

-- Ensure table exists (no-op if already there)
create table if not exists public.school_invitation_codes (
  id uuid default gen_random_uuid() primary key,
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  code varchar(50) unique not null,
  invitation_type varchar(20) default 'teacher' check (invitation_type in ('teacher','parent','admin')),
  invited_email varchar(255) not null,
  invited_by uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid references public.users(id),
  max_uses integer default 1,
  current_uses integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.school_invitation_codes enable row level security;

-- Helpful indexes
create index if not exists idx_school_inv_codes_preschool on public.school_invitation_codes(preschool_id);
create index if not exists idx_school_inv_codes_code on public.school_invitation_codes(code);

-- Policies
drop policy if exists "tenant_select_school_invitation_codes" on public.school_invitation_codes;
create policy "tenant_select_school_invitation_codes" on public.school_invitation_codes
  for select using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.preschool_id = school_invitation_codes.preschool_id
        and u.role in ('principal','admin','preschool_admin','superadmin')
    )
  );

drop policy if exists "tenant_insert_school_invitation_codes" on public.school_invitation_codes;
create policy "tenant_insert_school_invitation_codes" on public.school_invitation_codes
  for insert with check (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.preschool_id = preschool_id
        and u.role in ('principal','admin','preschool_admin','superadmin')
    )
  );

drop policy if exists "tenant_update_school_invitation_codes" on public.school_invitation_codes;
create policy "tenant_update_school_invitation_codes" on public.school_invitation_codes
  for update using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.preschool_id = school_invitation_codes.preschool_id
        and u.role in ('principal','admin','preschool_admin','superadmin')
    )
  ) with check (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.preschool_id = school_invitation_codes.preschool_id
        and u.role in ('principal','admin','preschool_admin','superadmin')
    )
  );

drop policy if exists "tenant_delete_school_invitation_codes" on public.school_invitation_codes;
create policy "tenant_delete_school_invitation_codes" on public.school_invitation_codes
  for delete using (
    exists (
      select 1 from public.users u
      where u.auth_user_id = auth.uid()
        and u.preschool_id = school_invitation_codes.preschool_id
        and u.role in ('principal','admin','preschool_admin','superadmin')
    )
  );
