-- Billing preferences and AI overage logs
-- Create helper function to update updated_at if not exists
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_current_timestamp_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
    RETURNS trigger AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $do$;

-- billing_preferences table
CREATE TABLE IF NOT EXISTS public.billing_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  overage_enabled boolean NOT NULL DEFAULT false,
  overage_price_per_unit numeric(10,2) NOT NULL DEFAULT 3.00,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_billing_preferences_updated_at
BEFORE UPDATE ON public.billing_preferences
FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_billing_preferences_user_id ON public.billing_preferences(user_id);

ALTER TABLE public.billing_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own billing preferences
DROP POLICY IF EXISTS billing_prefs_select_own ON public.billing_preferences;
CREATE POLICY billing_prefs_select_own ON public.billing_preferences
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Allow users to insert their own billing preferences (first-time toggle)
DROP POLICY IF EXISTS billing_prefs_insert_own ON public.billing_preferences;
CREATE POLICY billing_prefs_insert_own ON public.billing_preferences
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Allow users to update their own billing preferences
DROP POLICY IF EXISTS billing_prefs_update_own ON public.billing_preferences;
CREATE POLICY billing_prefs_update_own ON public.billing_preferences
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- ai_overage_logs table (inserted by server/edge function only)
CREATE TABLE IF NOT EXISTS public.ai_overage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  units int NOT NULL DEFAULT 1,
  amount numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_overage_logs_user_id ON public.ai_overage_logs(user_id);

ALTER TABLE public.ai_overage_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own overage logs; disallow insert/update/delete from client
DROP POLICY IF EXISTS ai_overage_logs_select_own ON public.ai_overage_logs;
CREATE POLICY ai_overage_logs_select_own ON public.ai_overage_logs
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

