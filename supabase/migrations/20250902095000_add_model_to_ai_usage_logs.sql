-- Add model column to ai_usage_logs and helpful indexes
-- Guard against missing ai_usage_logs table by creating it if necessary
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'ai_usage_logs'
  ) THEN
    -- Table exists: just add column and indexes
    ALTER TABLE public.ai_usage_logs
      ADD COLUMN IF NOT EXISTS model text;

    CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created
      ON public.ai_usage_logs(user_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model
      ON public.ai_usage_logs(model);
  ELSE
    RAISE NOTICE 'ai_usage_logs table missing, creating minimal schema and applying updates';

    CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid,
      feature text NOT NULL,
      tokens_used integer DEFAULT 0,
      cost_usd numeric(10,4) DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );

    -- Apply the new column and indexes
    ALTER TABLE public.ai_usage_logs
      ADD COLUMN IF NOT EXISTS model text;

    CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created
      ON public.ai_usage_logs(user_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model
      ON public.ai_usage_logs(model);
  END IF;
END $$;

