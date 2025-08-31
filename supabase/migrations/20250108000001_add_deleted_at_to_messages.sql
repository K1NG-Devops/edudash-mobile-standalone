-- Add deleted_at column to messages table for soft deletion support
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Add index for better performance when filtering non-deleted messages
CREATE INDEX IF NOT EXISTS idx_messages_deleted_at 
ON messages(deleted_at) 
WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN messages.deleted_at IS 'Timestamp for soft deletion of messages';
