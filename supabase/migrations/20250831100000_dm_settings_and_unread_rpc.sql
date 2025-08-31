begin;

-- Create per-user Direct Message settings table for mute/clear
create table if not exists public.dm_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  partner_user_id uuid not null references public.users(id) on delete cascade,
  is_muted boolean not null default false,
  cleared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, partner_user_id)
);

-- Update trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;$$;

create trigger dm_settings_set_updated_at
  before update on public.dm_settings
  for each row execute function public.set_updated_at();

-- RLS and policies
alter table public.dm_settings enable row level security;

-- Only owners can manage their rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_settings' AND policyname='dm_settings_select_self'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY dm_settings_select_self ON public.dm_settings
      FOR SELECT TO authenticated
      USING (
        user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_settings' AND policyname='dm_settings_insert_self'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY dm_settings_insert_self ON public.dm_settings
      FOR INSERT TO authenticated
      WITH CHECK (
        user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dm_settings' AND policyname='dm_settings_update_self'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY dm_settings_update_self ON public.dm_settings
      FOR UPDATE TO authenticated
      USING (
        user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
      WITH CHECK (
        user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
    $pol$;
  END IF;
END$$;

-- Helper RPC to compute unread counts across DMs (message_recipients) and Rooms (conversation_members/messages)
create or replace function public.get_total_unread_counts()
returns table(dm_unread integer, room_unread integer, total integer)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from public.users where auth_user_id = auth.uid();
  if v_user_id is null then
    return query select 0, 0, 0;
    return;
  end if;

  -- Direct/unicast messages unread via message_recipients
  select count(*) into dm_unread
  from public.message_recipients mr
  join public.messages m on m.id = mr.message_id
  where mr.recipient_id = v_user_id
    and coalesce(mr.is_read, false) = false
    and coalesce(mr.is_archived, false) = false;

  -- Room unread: messages in conversations after member's last_read_at, excluding own messages
  select coalesce(sum(cnt), 0) into room_unread
  from (
    select cm.conversation_id, count(*)::int as cnt
    from public.conversation_members cm
    join public.messages m on m.conversation_id = cm.conversation_id
    where cm.user_id = v_user_id
      and (cm.last_read_at is null or m.created_at > cm.last_read_at)
      and m.sender_id <> v_user_id
    group by cm.conversation_id
  ) s;

  return query select coalesce(dm_unread,0), coalesce(room_unread,0), coalesce(dm_unread,0) + coalesce(room_unread,0);
end;
$$;

commit;

