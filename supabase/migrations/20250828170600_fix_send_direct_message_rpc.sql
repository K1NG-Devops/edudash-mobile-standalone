begin;

-- Fix function signature: required params first, then defaults
create or replace function public.send_direct_message(
  p_recipient_user_id uuid,
  p_content text,
  p_subject text default '',
  p_message_type text default 'direct',
  p_priority text default 'normal'
)
returns uuid
language plpgsql
security definer
set search_path = public
stable
as $$
DECLARE
  v_me public.users%rowtype;
  v_recipient public.users%rowtype;
  v_message_id uuid;
BEGIN
  SELECT * INTO v_me FROM public.users WHERE auth_user_id = auth.uid();
  IF v_me.id IS NULL THEN
    RAISE EXCEPTION 'user not found for auth uid %', auth.uid() USING ERRCODE = '28000';
  END IF;

  SELECT * INTO v_recipient FROM public.users WHERE id = p_recipient_user_id;
  IF v_recipient.id IS NULL THEN
    RAISE EXCEPTION 'recipient not found' USING ERRCODE = '22023';
  END IF;

  IF v_recipient.preschool_id IS DISTINCT FROM v_me.preschool_id THEN
    RAISE EXCEPTION 'recipient not in same preschool' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.messages (
    preschool_id, sender_id, subject, content, message_type, priority
  ) VALUES (
    v_me.preschool_id, v_me.id, COALESCE(p_subject, ''), p_content, COALESCE(p_message_type, 'direct'), COALESCE(p_priority, 'normal')
  ) RETURNING id INTO v_message_id;

  INSERT INTO public.message_recipients (message_id, recipient_id)
  VALUES (v_message_id, v_recipient.id);

  RETURN v_message_id;
END;
$$;

revoke all on function public.send_direct_message(uuid, text, text, text, text) from public;
grant execute on function public.send_direct_message(uuid, text, text, text, text) to authenticated;

commit;
