-- Create unread announcement/count helpers guarded by existence of messaging tables
DO $block$
DECLARE
  has_messages boolean;
  has_recipients boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='messages'
  ) INTO has_messages;
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='message_recipients'
  ) INTO has_recipients;

  IF has_messages AND has_recipients THEN
    -- get_unread_announcements_count
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION get_unread_announcements_count(p_user_id UUID)
      RETURNS INTEGER AS $$
      DECLARE
        v_count INTEGER;
      BEGIN
        SELECT COUNT(DISTINCT m.id)
        INTO v_count
        FROM messages m
        INNER JOIN message_recipients mr ON m.id = mr.message_id
        WHERE mr.recipient_id = p_user_id
          AND mr.read_at IS NULL
          AND m.message_type = 'announcement'
          AND m.deleted_at IS NULL;
        RETURN COALESCE(v_count, 0);
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    $fn$;

    EXECUTE 'GRANT EXECUTE ON FUNCTION get_unread_announcements_count(UUID) TO authenticated';

    -- get_unread_counts
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION get_unread_counts(p_user_id UUID)
      RETURNS TABLE(
        unread_messages INTEGER,
        unread_announcements INTEGER,
        total_unread INTEGER
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (SELECT COUNT(DISTINCT m.id)
           FROM messages m
           INNER JOIN message_recipients mr ON m.id = mr.message_id
           WHERE mr.recipient_id = p_user_id
             AND mr.read_at IS NULL
             AND m.message_type != 'announcement'
             AND m.deleted_at IS NULL) AS unread_messages,
          (SELECT COUNT(DISTINCT m.id)
           FROM messages m
           INNER JOIN message_recipients mr ON m.id = mr.message_id
           WHERE mr.recipient_id = p_user_id
             AND mr.read_at IS NULL
             AND m.message_type = 'announcement'
             AND m.deleted_at IS NULL) AS unread_announcements,
          (SELECT COUNT(DISTINCT m.id)
           FROM messages m
           INNER JOIN message_recipients mr ON m.id = mr.message_id
           WHERE mr.recipient_id = p_user_id
             AND mr.read_at IS NULL
             AND m.deleted_at IS NULL) AS total_unread;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    $fn$;

    EXECUTE 'GRANT EXECUTE ON FUNCTION get_unread_counts(UUID) TO authenticated';

    -- Supporting indexes
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_message_recipients_unread_announcements ON message_recipients(recipient_id) WHERE read_at IS NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_messages_type_deleted ON messages(message_type, deleted_at) WHERE deleted_at IS NULL';
  END IF;
END
$block$;
