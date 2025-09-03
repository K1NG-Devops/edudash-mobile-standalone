-- Add model column to ai_usage_logs and helpful indexes
ALTER TABLE public.ai_usage_logs
  ADD COLUMN IF NOT EXISTS model text;

-- Helpful indexes for usage analytics and rate limiting
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_created
  ON public.ai_usage_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model
  ON public.ai_usage_logs(model);

