-- 2025-08-28: Backward-compat hotfix for messages.message_type
-- Non-destructive: temporarily re-allow legacy 'private' while client updates roll out
-- IMPORTANT: Follow-up migration should remove 'private' after clients stop sending it

begin;

DO $$
DECLARE r record; 
BEGIN
  -- Drop any existing CHECK constraints on message_type
  FOR r IN (
    SELECT conname 
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass 
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%message_type%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- Re-add a widened CHECK that includes legacy 'private'
  ALTER TABLE public.messages
    ADD CONSTRAINT messages_message_type_check
    CHECK (message_type IN ('direct','announcement','system','homework_discussion','private'));
END $$;

commit;

