-- Add deleted_at column to messages table for soft deletion support
-- Guarded to avoid failures when messages table does not yet exist in some environments
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'messages'
  ) THEN
    ALTER TABLE IF EXISTS public.messages
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    -- Add index for better performance when filtering non-deleted messages
    CREATE INDEX IF NOT EXISTS idx_messages_deleted_at 
      ON public.messages(deleted_at) 
      WHERE deleted_at IS NULL;

    -- Add comment for documentation
    COMMENT ON COLUMN public.messages.deleted_at IS 'Timestamp for soft deletion of messages';
  END IF;
END $$;
