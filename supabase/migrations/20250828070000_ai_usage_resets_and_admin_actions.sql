-- ai_usage_resets and ai_admin_actions tables
-- Purpose: Support superadmin-triggered soft resets of AI usage limits with full audit trails

BEGIN;

-- 1) ai_usage_resets: records each reset request
CREATE TABLE IF NOT EXISTS public.ai_usage_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  target_scope text NOT NULL CHECK (target_scope IN ('user','preschool','platform')),
  target_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  target_preschool_id uuid NULL REFERENCES public.preschools(id) ON DELETE SET NULL,
  mode text NOT NULL DEFAULT 'soft' CHECK (mode IN ('soft','hard')),
  reason text NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','failed')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_resets_scope_created_at ON public.ai_usage_resets (target_scope, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_resets_user ON public.ai_usage_resets (target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_resets_school ON public.ai_usage_resets (target_preschool_id, created_at DESC);

-- RLS
ALTER TABLE public.ai_usage_resets ENABLE ROW LEVEL SECURITY;

-- Superadmins can see and write everything
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_usage_resets' AND policyname = 'ai_usage_resets_superadmin_all'
  ) THEN
    CREATE POLICY "ai_usage_resets_superadmin_all" ON public.ai_usage_resets
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_user_id = auth.uid()
            AND u.role = 'superadmin'
            AND u.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_user_id = auth.uid()
            AND u.role = 'superadmin'
            AND u.is_active = true
        )
      );
  END IF;
END $$;

-- 2) ai_admin_actions: generic admin audit log (reset actions and future admin ops)
CREATE TABLE IF NOT EXISTS public.ai_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  action text NOT NULL, -- e.g., 'ai_usage_reset'
  target_scope text NULL, -- 'user' | 'preschool' | 'platform'
  target_user_id uuid NULL REFERENCES public.users(id) ON DELETE SET NULL,
  target_preschool_id uuid NULL REFERENCES public.preschools(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_admin_actions_action_created_at ON public.ai_admin_actions (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_admin_actions_actor_created_at ON public.ai_admin_actions (actor_user_id, created_at DESC);

ALTER TABLE public.ai_admin_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ai_admin_actions' AND policyname = 'ai_admin_actions_superadmin_all'
  ) THEN
    CREATE POLICY "ai_admin_actions_superadmin_all" ON public.ai_admin_actions
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_user_id = auth.uid()
            AND u.role = 'superadmin'
            AND u.is_active = true
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_user_id = auth.uid()
            AND u.role = 'superadmin'
            AND u.is_active = true
        )
      );
  END IF;
END $$;

COMMIT;

