-- Create function to get unread announcement count for a user
CREATE OR REPLACE FUNCTION get_unread_announcements_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Count unread announcements for the user
  SELECT COUNT(DISTINCT m.id)
  INTO v_count
  FROM messages m
  INNER JOIN message_recipients mr ON m.id = mr.message_id
  WHERE mr.recipient_id = p_user_id
    AND mr.is_read = false
    AND m.message_type = 'announcement'
    AND m.deleted_at IS NULL;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_announcements_count(UUID) TO authenticated;

-- Optional: Create a more comprehensive function that returns both regular message and announcement counts
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
       AND mr.is_read = false
       AND m.message_type != 'announcement'
       AND m.deleted_at IS NULL) AS unread_messages,
    (SELECT COUNT(DISTINCT m.id)
     FROM messages m
     INNER JOIN message_recipients mr ON m.id = mr.message_id
     WHERE mr.recipient_id = p_user_id
       AND mr.is_read = false
       AND m.message_type = 'announcement'
       AND m.deleted_at IS NULL) AS unread_announcements,
    (SELECT COUNT(DISTINCT m.id)
     FROM messages m
     INNER JOIN message_recipients mr ON m.id = mr.message_id
     WHERE mr.recipient_id = p_user_id
       AND mr.is_read = false
       AND m.deleted_at IS NULL) AS total_unread;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_counts(UUID) TO authenticated;

-- Create an index to optimize the unread count queries
CREATE INDEX IF NOT EXISTS idx_message_recipients_unread_announcements 
ON message_recipients(recipient_id, is_read) 
WHERE is_read = false;

-- Create a composite index for better performance on announcement queries
CREATE INDEX IF NOT EXISTS idx_messages_type_deleted 
ON messages(message_type, deleted_at) 
WHERE deleted_at IS NULL;
