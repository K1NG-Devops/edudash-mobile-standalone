begin;

-- Ensure RLS is enabled and minimal grants are in place
alter table if exists public.message_recipients enable row level security;
grant select, insert, update on public.message_recipients to authenticated;

-- INSERT: only the sender of the parent message may create recipient rows
-- Scope: recipient must belong to the same preschool as the message's preschool
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'message_recipients'
      AND policyname = 'message_recipients_insert_by_sender'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY message_recipients_insert_by_sender
      ON public.message_recipients
      FOR INSERT
      TO authenticated
      WITH CHECK (
        -- Current user must be the sender of the parent message
        EXISTS (
          SELECT 1
          FROM public.messages m
          JOIN public.users u_sender ON u_sender.id = m.sender_id
          WHERE m.id = message_recipients.message_id
            AND u_sender.auth_user_id = auth.uid()
        )
        AND EXISTS (
          SELECT 1
          FROM public.users r
          JOIN public.messages m2 ON m2.id = message_recipients.message_id
          WHERE r.id = message_recipients.recipient_id
            AND r.preschool_id = m2.preschool_id
        )
      );
    $pol$;
  END IF;
END $$;

-- UPDATE: recipients can update their own receipt row (e.g., is_read/read_at, is_archived/archived_at)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'message_recipients'
      AND policyname = 'message_recipients_update_by_recipient'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY message_recipients_update_by_recipient
      ON public.message_recipients
      FOR UPDATE
      TO authenticated
      USING (
        recipient_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
      WITH CHECK (
        recipient_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      );
    $pol$;
  END IF;
END $$;

-- OPTIONAL SELECT: Allow senders to view recipient rows for messages they sent
-- Helpful for "sent" views; SELECT is read-only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'message_recipients'
      AND policyname = 'message_recipients_select_by_sender'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY message_recipients_select_by_sender
      ON public.message_recipients
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.messages m
          JOIN public.users u_sender ON u_sender.id = m.sender_id
          WHERE m.id = message_recipients.message_id
            AND u_sender.auth_user_id = auth.uid()
        )
      );
    $pol$;
  END IF;
END $$;

commit;
