-- Fix send_school_announcement array concatenation issue
begin;

create or replace function public.send_school_announcement(
  p_content text,
  p_subject text default '',
  p_include_parents boolean default true,
  p_include_staff boolean default false,
  p_include_sender boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_id uuid;
  v_preschool_id uuid;
  v_message_id uuid;
  v_roles text[] := ARRAY[]::text[];
begin
  -- Resolve current user and preschool
  select id, preschool_id into v_sender_id, v_preschool_id
  from public.users
  where auth_user_id = auth.uid();

  if v_sender_id is null or v_preschool_id is null then
    raise exception 'User not associated with a preschool or not authenticated';
  end if;

  -- Insert the message
  insert into public.messages (preschool_id, sender_id, subject, content, message_type)
  values (v_preschool_id, v_sender_id, coalesce(p_subject, ''), p_content, 'announcement')
  returning id into v_message_id;

  -- Build role filter (fix: use array literal syntax)
  if p_include_parents then
    v_roles := v_roles || ARRAY['parent'];
  end if;
  if p_include_staff then
    v_roles := v_roles || ARRAY['teacher','preschool_admin','admin','principal'];
  end if;

  -- Insert recipients: audience in same preschool
  if array_length(v_roles, 1) is not null then
    insert into public.message_recipients (message_id, recipient_type, recipient_id)
    select v_message_id, 'user', u.id
    from public.users u
    where u.preschool_id = v_preschool_id
      and u.role = any (v_roles)
      and u.id <> v_sender_id;
  end if;

  -- Optionally include sender so they also see it under Announcements
  if p_include_sender then
    insert into public.message_recipients (message_id, recipient_type, recipient_id)
    values (v_message_id, 'user', v_sender_id);
  end if;

  return v_message_id;
end;
$$;

commit;
