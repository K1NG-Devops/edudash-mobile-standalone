-- Create teacher_invitations table for managing teacher onboarding
create table if not exists public.teacher_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  phone text,
  invitation_code text not null,
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  invited_by uuid not null references public.users(id) on delete restrict,
  status text not null check (status in ('pending','accepted','expired','cancelled')) default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  cancelled_at timestamptz
);

-- Indexes
create index if not exists idx_teacher_invitations_preschool on public.teacher_invitations(preschool_id);
create index if not exists idx_teacher_invitations_status on public.teacher_invitations(status);
create index if not exists idx_teacher_invitations_email on public.teacher_invitations(email);

-- Enable RLS
alter table public.teacher_invitations enable row level security;

-- Policies: tenant isolation; principals and superadmins manage
drop policy if exists "tenant_select_teacher_invitations" on public.teacher_invitations;
create policy "tenant_select_teacher_invitations" on public.teacher_invitations
  for select
  using (
    preschool_id = auth.uid()::uuid or
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.role = 'preschool_admin' or u.role = 'superadmin')
        and u.preschool_id = teacher_invitations.preschool_id
    )
  );

drop policy if exists "tenant_insert_teacher_invitations" on public.teacher_invitations;
create policy "tenant_insert_teacher_invitations" on public.teacher_invitations
  for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.role = 'preschool_admin' or u.role = 'superadmin')
        and u.preschool_id = preschool_id
    )
  );

drop policy if exists "tenant_update_teacher_invitations" on public.teacher_invitations;
create policy "tenant_update_teacher_invitations" on public.teacher_invitations
  for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.role = 'preschool_admin' or u.role = 'superadmin')
        and u.preschool_id = teacher_invitations.preschool_id
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.role = 'preschool_admin' or u.role = 'superadmin')
        and u.preschool_id = teacher_invitations.preschool_id
    )
  );

drop policy if exists "tenant_delete_teacher_invitations" on public.teacher_invitations;
create policy "tenant_delete_teacher_invitations" on public.teacher_invitations
  for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.role = 'preschool_admin' or u.role = 'superadmin')
        and u.preschool_id = teacher_invitations.preschool_id
    )
  );


