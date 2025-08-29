begin;

-- Adjust INSERT policy: check recipient is in same preschool as current user (sender),
-- rather than comparing to message.preschool_id. This avoids mismatches and remains tenant-safe.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'message_recipients'
      AND policyname = 'message_recipients_insert_by_sender'
  ) THEN
    EXECUTE 'DROP POLICY message_recipients_insert_by_sender ON public.message_recipients';
  END IF;
END $$;

CREATE POLICY message_recipients_insert_by_sender
ON public.message_recipients
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only the sender of the parent message can add recipients
  EXISTS (
    SELECT 1
    FROM public.messages m
    JOIN public.users u_sender ON u_sender.id = m.sender_id
    WHERE m.id = message_recipients.message_id
      AND u_sender.auth_user_id = auth.uid()
  )
  AND (
    -- Recipient must belong to the same preschool as the current user
    message_recipients.recipient_id IN (
      SELECT u.id
      FROM public.users u
      WHERE u.preschool_id = (
        SELECT me.preschool_id
        FROM public.users me
        WHERE me.auth_user_id = auth.uid()
      )
    )
  )
);

commit;
