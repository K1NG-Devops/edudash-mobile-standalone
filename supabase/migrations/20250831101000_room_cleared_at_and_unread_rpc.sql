begin;

-- Add per-user cleared_at for rooms (conversation_members)
alter table if exists public.conversation_members
  add column if not exists cleared_at timestamptz;

-- Improve unread RPC to respect cleared_at (if it exists)
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

  -- Room unread: messages after max(last_read_at, cleared_at), excluding own messages
  select coalesce(sum(cnt), 0) into room_unread
  from (
    select cm.conversation_id, count(*)::int as cnt
    from public.conversation_members cm
    join public.messages m on m.conversation_id = cm.conversation_id
    where cm.user_id = v_user_id
      and (greatest(coalesce(cm.last_read_at, timestamp 'epoch'), coalesce(cm.cleared_at, timestamp 'epoch')) is null
           or m.created_at > greatest(coalesce(cm.last_read_at, timestamp 'epoch'), coalesce(cm.cleared_at, timestamp 'epoch')))
      and m.sender_id <> v_user_id
    group by cm.conversation_id
  ) s;

  return query select coalesce(dm_unread,0), coalesce(room_unread,0), coalesce(dm_unread,0) + coalesce(room_unread,0);
end;
$$;

commit;

