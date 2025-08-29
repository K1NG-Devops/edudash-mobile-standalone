-- Migration: add FK for plan embedding and view for users with subscription
-- Applies to: hosted Supabase project
-- Safe: uses IF NOT EXISTS / DO blocks to avoid errors on reapply

-- 1) Index on platform_subscriptions.plan_id (for join performance)
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_plan_id
  ON public.platform_subscriptions (plan_id);

-- 2) Add the foreign key so PostgREST can embed plan:subscription_plans(*) safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_subscriptions_plan_id_fkey'
  ) THEN
    ALTER TABLE public.platform_subscriptions
      ADD CONSTRAINT platform_subscriptions_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.subscription_plans (id)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END$$;

-- 3) Optional: a convenience view exposing latest subscription info with users
--    This does NOT change your existing code automatically, but you can query
--    public.users_with_subscription to avoid adding non-existent columns to users.
CREATE OR REPLACE VIEW public.users_with_subscription AS
SELECT
  u.*, 
  s.status AS latest_subscription_status,
  s.plan_id AS latest_subscription_plan_id,
  s.billing_interval AS latest_subscription_billing_interval,
  s.current_period_end AS latest_subscription_current_period_end
FROM public.users u
LEFT JOIN LATERAL (
  SELECT ps.status, ps.plan_id, ps.billing_interval, ps.current_period_end
  FROM public.platform_subscriptions ps
  WHERE ps.user_id = u.auth_user_id
    AND ps.status IN ('trial','active','past_due')
  ORDER BY ps.created_at DESC
  LIMIT 1
) s ON TRUE;

GRANT SELECT ON public.users_with_subscription TO anon, authenticated;

