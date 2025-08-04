-- Enhanced Messaging System Tables
-- This migration adds comprehensive messaging functionality including real-time chat, announcements, and file attachments

-- Messages table for storing all communications
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Message content and type
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'announcement', 'system')),
  
  -- Sender and receiver information
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('parent', 'teacher', 'admin', 'system')),
  receiver_type VARCHAR(20) CHECK (receiver_type IN ('parent', 'teacher', 'admin', 'all_parents', 'all_teachers')),
  
  -- Message metadata
  thread_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For replies/conversations
  child_id UUID REFERENCES students(id) ON DELETE CASCADE, -- Related child (optional)
  preschool_id UUID REFERENCES preschools(id) ON DELETE CASCADE,
  
  -- Message status
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Search optimization
  search_vector TSVECTOR
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  
  -- File information
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message reactions table (for future enhancement)
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate reactions from same user on same message
  UNIQUE(message_id, user_id, reaction_type)
);

-- Conversation participants table (for group conversations)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Participant status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_read_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  
  -- Prevent duplicate participants
  UNIQUE(thread_id, user_id)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification settings
  email_messages BOOLEAN NOT NULL DEFAULT TRUE,
  push_messages BOOLEAN NOT NULL DEFAULT TRUE,
  email_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  push_announcements BOOLEAN NOT NULL DEFAULT TRUE,
  email_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  push_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Communication preferences
  allow_direct_messages BOOLEAN NOT NULL DEFAULT TRUE,
  allow_group_messages BOOLEAN NOT NULL DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One preference record per user
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_child_id ON messages(child_id);
CREATE INDEX IF NOT EXISTS idx_messages_preschool_id ON messages(preschool_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);
CREATE INDEX IF NOT EXISTS idx_messages_search_vector ON messages USING GIN(search_vector);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_thread_id ON conversation_participants(thread_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread_receiver ON messages(receiver_id, is_read, created_at DESC);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search vector
DROP TRIGGER IF EXISTS trigger_update_message_search_vector ON messages;
CREATE TRIGGER trigger_update_message_search_vector
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_message_attachments_updated_at ON message_attachments;
CREATE TRIGGER trigger_message_attachments_updated_at
  BEFORE UPDATE ON message_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_user_notification_preferences_updated_at ON user_notification_preferences;
CREATE TRIGGER trigger_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically mark messages as read when accessed
CREATE OR REPLACE FUNCTION mark_message_as_read(message_ids UUID[], user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET is_read = TRUE, read_at = NOW()
  WHERE id = ANY(message_ids) 
    AND receiver_id = user_id 
    AND is_read = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM messages
  WHERE receiver_id = user_id AND is_read = FALSE;
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation participants
CREATE OR REPLACE FUNCTION get_conversation_participants(thread_id UUID)
RETURNS TABLE(
  user_id UUID,
  user_name VARCHAR,
  user_role VARCHAR,
  avatar_url TEXT,
  last_read_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id,
    u.name,
    u.role,
    u.avatar_url,
    cp.last_read_at,
    cp.is_active
  FROM conversation_participants cp
  JOIN users u ON u.id = cp.user_id
  WHERE cp.thread_id = get_conversation_participants.thread_id
    AND cp.is_active = TRUE
  ORDER BY cp.joined_at;
END;
$$ LANGUAGE plpgsql;

-- Create Row Level Security (RLS) policies

-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages they sent or received
CREATE POLICY messages_select_policy ON messages
  FOR SELECT USING (
    sender_id = auth.uid()::uuid OR 
    receiver_id = auth.uid()::uuid OR
    (receiver_type = 'all_parents' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role = 'parent'
    )) OR
    (receiver_type = 'all_teachers' AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()::uuid AND role IN ('teacher', 'admin')
    ))
  );

-- Policy: Users can insert messages they are sending
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid()::uuid);

-- Policy: Users can update messages they sent (for editing/deleting)
CREATE POLICY messages_update_policy ON messages
  FOR UPDATE USING (sender_id = auth.uid()::uuid);

-- Policy: Users can delete messages they sent
CREATE POLICY messages_delete_policy ON messages
  FOR DELETE USING (sender_id = auth.uid()::uuid);

-- Enable RLS on message_attachments table
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access attachments for messages they can see
CREATE POLICY message_attachments_select_policy ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id 
        AND (m.sender_id = auth.uid()::uuid OR m.receiver_id = auth.uid()::uuid)
    )
  );

-- Policy: Users can insert attachments for messages they are sending
CREATE POLICY message_attachments_insert_policy ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id AND m.sender_id = auth.uid()::uuid
    )
  );

-- Enable RLS on message_reactions table
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see reactions on messages they can access
CREATE POLICY message_reactions_select_policy ON message_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id 
        AND (m.sender_id = auth.uid()::uuid OR m.receiver_id = auth.uid()::uuid)
    )
  );

-- Policy: Users can add reactions to messages they can see
CREATE POLICY message_reactions_insert_policy ON message_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()::uuid AND
    EXISTS (
      SELECT 1 FROM messages m 
      WHERE m.id = message_id 
        AND (m.sender_id = auth.uid()::uuid OR m.receiver_id = auth.uid()::uuid)
    )
  );

-- Policy: Users can remove their own reactions
CREATE POLICY message_reactions_delete_policy ON message_reactions
  FOR DELETE USING (user_id = auth.uid()::uuid);

-- Enable RLS on user_notification_preferences table
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own notification preferences
CREATE POLICY user_notification_preferences_policy ON user_notification_preferences
  FOR ALL USING (user_id = auth.uid()::uuid);

-- Insert default notification preferences for existing users
INSERT INTO user_notification_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Add some sample announcement messages for testing
INSERT INTO messages (
  content,
  message_type,
  sender_id,
  receiver_type,
  sender_type,
  preschool_id,
  is_important
) VALUES 
(
  'Welcome to the new school year! We''re excited to have your children back for another year of learning and growth.',
  'announcement',
  (SELECT id FROM users WHERE role IN ('admin', 'principal') LIMIT 1),
  'all_parents',
  'admin',
  (SELECT id FROM preschools LIMIT 1),
  true
),
(
  'Parent-Teacher conferences will be held next week. Please check your calendar for your scheduled time slot.',
  'announcement',
  (SELECT id FROM users WHERE role IN ('admin', 'principal') LIMIT 1),
  'all_parents',
  'admin',
  (SELECT id FROM preschools LIMIT 1),
  false
),
(
  'School will be closed on Monday for teacher professional development day.',
  'announcement',
  (SELECT id FROM users WHERE role IN ('admin', 'principal') LIMIT 1),
  'all_parents',
  'admin',
  (SELECT id FROM preschools LIMIT 1),
  true
);

-- Create a view for easier conversation querying
CREATE OR REPLACE VIEW conversation_summary AS
SELECT DISTINCT
  CASE 
    WHEN m.sender_id < m.receiver_id THEN m.sender_id::text || '_' || m.receiver_id::text
    ELSE m.receiver_id::text || '_' || m.sender_id::text
  END as conversation_id,
  CASE 
    WHEN m.sender_id < m.receiver_id THEN m.sender_id
    ELSE m.receiver_id
  END as participant_1_id,
  CASE 
    WHEN m.sender_id < m.receiver_id THEN m.receiver_id
    ELSE m.sender_id
  END as participant_2_id,
  p1.name as participant_1_name,
  p1.role as participant_1_role,
  p1.avatar_url as participant_1_avatar,
  p2.name as participant_2_name,
  p2.role as participant_2_role,
  p2.avatar_url as participant_2_avatar,
  latest.content as last_message,
  latest.created_at as last_message_time,
  latest.sender_id as last_sender_id,
  COALESCE(unread.unread_count, 0) as unread_count
FROM messages m
JOIN users p1 ON p1.id = CASE 
  WHEN m.sender_id < m.receiver_id THEN m.sender_id
  ELSE m.receiver_id
END
JOIN users p2 ON p2.id = CASE 
  WHEN m.sender_id < m.receiver_id THEN m.receiver_id
  ELSE m.sender_id
END
JOIN LATERAL (
  SELECT content, created_at, sender_id
  FROM messages m2
  WHERE (m2.sender_id = m.sender_id AND m2.receiver_id = m.receiver_id)
     OR (m2.sender_id = m.receiver_id AND m2.receiver_id = m.sender_id)
  ORDER BY created_at DESC
  LIMIT 1
) latest ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*) as unread_count
  FROM messages m3
  WHERE m3.receiver_id = CASE 
    WHEN auth.uid()::uuid = CASE 
      WHEN m.sender_id < m.receiver_id THEN m.sender_id
      ELSE m.receiver_id
    END THEN CASE 
      WHEN m.sender_id < m.receiver_id THEN m.receiver_id
      ELSE m.sender_id
    END
    ELSE CASE 
      WHEN m.sender_id < m.receiver_id THEN m.sender_id
      ELSE m.receiver_id
    END
  END
  AND m3.is_read = false
) unread ON true
WHERE m.message_type = 'text'
  AND m.receiver_id IS NOT NULL;

COMMENT ON TABLE messages IS 'Stores all messages between users including text, announcements, and file attachments';
COMMENT ON TABLE message_attachments IS 'Stores file attachments for messages';
COMMENT ON TABLE message_reactions IS 'Stores user reactions to messages (likes, etc.)';
COMMENT ON TABLE conversation_participants IS 'Manages participants in group conversations';
COMMENT ON TABLE user_notification_preferences IS 'User preferences for notifications and communication';
COMMENT ON VIEW conversation_summary IS 'Simplified view of conversations with last message and unread count';
