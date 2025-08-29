-- 2025-08-27: Add conversations + conversation_members, wire messages.conversation_id, and RLS helper
-- Safe/idempotent migration focusing on group/announcement permissions with staff control

begin;

-- Ensure required extension
create extension if not exists pgcrypto with schema extensions;

-- Conversations table (room-level)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  preschool_id uuid not null references public.preschools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  type text not null default 'group' check (type in ('direct','group','announcement')),
  name text,
  description text,
  created_by uuid references public.users(id) on delete set null,
  settings jsonb not null default '{"admins_only": false, "locked": false, "allow_member_posting": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_conversations_preschool on public.conversations(preschool_id);
create index if not exists idx_conversations_class on public.conversations(class_id);

-- Conversation members (participants)
create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  is_muted boolean not null default false,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  unique(conversation_id, user_id)
);

create index if not exists idx_conversation_members_conv on public.conversation_members(conversation_id);
create index if not exists idx_conversation_members_user on public.conversation_members(user_id);

-- Messages: add conversation_id for group/announcement threads
alter table if exists public.messages
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade;

create index if not exists idx_messages_conversation on public.messages(conversation_id);

-- Timestamp helper, if not present
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

-- Triggers
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.update_updated_at();

-- SECURITY DEFINER helper: can the current auth user send in this conversation?
create or replace function public.can_send_in_conversation(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_settings jsonb;
  v_role text;
  v_admins_only boolean := false;
  v_locked boolean := false;
  v_allow_member boolean := true;
  v_user_id uuid;
begin
  select id into v_user_id from public.users where auth_user_id = auth.uid();
  if v_user_id is null then
    return false;
  end if;

  select settings into v_settings from public.conversations where id = p_conversation_id;
  if not found then
    return false;
  end if;

  v_admins_only := coalesce((v_settings->>'admins_only')::boolean, false);
  v_locked := coalesce((v_settings->>'locked')::boolean, false);
  v_allow_member := coalesce((v_settings->>'allow_member_posting')::boolean, true);

  select role into v_role
  from public.conversation_members
  where conversation_id = p_conversation_id
    and user_id = v_user_id;

  if v_role is null then
    return false; -- not a member
  end if;

  if v_locked then
    return v_role in ('owner','admin');
  end if;

  if v_admins_only then
    return v_role in ('owner','admin');
  end if;

  if v_allow_member then
    return true; -- members may post
  end if;

  return v_role in ('owner','admin');
end;$$;

-- RLS: conversations and members
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;

-- Policy: list/view conversations only if member
drop policy if exists conversations_select_members_only_v2 on public.conversations;
create policy conversations_select_members_only_v2
  on public.conversations
  for select
  to authenticated
  using (
    exists (
      select 1
        from public.conversation_members cm
        join public.users u on u.id = cm.user_id
       where cm.conversation_id = conversations.id
         and u.auth_user_id = auth.uid()
    )
  );

-- Policy: create conversations (creator must match current user)
drop policy if exists conversations_insert_creator_v2 on public.conversations;
create policy conversations_insert_creator_v2
  on public.conversations
  for insert
  to authenticated
  with check (
    created_by = (select id from public.users where auth_user_id = auth.uid())
  );

-- Policy: update settings allowed to owners/admins
drop policy if exists conversations_update_admins_v2 on public.conversations;
create policy conversations_update_admins_v2
  on public.conversations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.conversation_members cm
      join public.users u on u.id = cm.user_id
      where cm.conversation_id = conversations.id
        and u.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.conversation_members cm
      join public.users u on u.id = cm.user_id
      where cm.conversation_id = conversations.id
        and u.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

-- conversation_members: members can view their membership rows
drop policy if exists conv_members_select_self_v2 on public.conversation_members;
create policy conv_members_select_self_v2
  on public.conversation_members
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users u
      where u.id = conversation_members.user_id
        and u.auth_user_id = auth.uid()
    )
    or exists (
      select 1 from public.conversation_members cm
      join public.users u2 on u2.id = cm.user_id
      where cm.conversation_id = conversation_members.conversation_id
        and u2.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

-- Add members: only owners/admins of that conversation
drop policy if exists conv_members_insert_admins_v2 on public.conversation_members;
create policy conv_members_insert_admins_v2
  on public.conversation_members
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversation_members cm
      join public.users u on u.id = cm.user_id
      where cm.conversation_id = conversation_members.conversation_id
        and u.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

-- Update/remove members: only owners/admins
drop policy if exists conv_members_update_admins_v2 on public.conversation_members;
create policy conv_members_update_admins_v2
  on public.conversation_members
  for update using (
    exists (
      select 1 from public.conversation_members cm
      join public.users u on u.id = cm.user_id
      where cm.conversation_id = conversation_members.conversation_id
        and u.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from public.conversation_members cm
      join public.users u on u.id = cm.user_id
      where cm.conversation_id = conversation_members.conversation_id
        and u.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

drop policy if exists conv_members_delete_admins_v2 on public.conversation_members;
create policy conv_members_delete_admins_v2
  on public.conversation_members
  for delete using (
    exists (
      select 1 from public.conversation_members cm
      join public.users u on u.id = cm.user_id
      where cm.conversation_id = conversation_members.conversation_id
        and u.auth_user_id = auth.uid()
        and cm.role in ('owner','admin')
    )
  );

-- Messages: conversation-scoped policies (keep existing DM policies intact)
-- View messages in conversations where user is a member
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'messages' AND p.policyname = 'messages_select_conversation_v2'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY messages_select_conversation_v2
        ON public.messages
        FOR SELECT
        TO authenticated
        USING (
          conversation_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.conversation_members cm
            JOIN public.users u ON u.id = cm.user_id
            WHERE cm.conversation_id = public.messages.conversation_id
              AND u.auth_user_id = auth.uid()
          )
        )
    $POL$;
  END IF;
END $$;

-- Send messages in conversations only if can_send_in_conversation and sender matches current user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'messages' AND p.policyname = 'messages_insert_conversation_v2'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY messages_insert_conversation_v2
        ON public.messages
        FOR INSERT
        TO authenticated
        WITH CHECK (
          conversation_id IS NOT NULL
          AND sender_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
          AND public.can_send_in_conversation(conversation_id)
        )
    $POL$;
  END IF;
END $$;

commit;
