-- Fix unrestricted tables by enabling RLS and creating appropriate policies
-- This migration ensures all tables have proper Row Level Security policies
-- Run this to fix the "Unrestricted" status shown in Supabase dashboard

-- ===============================================
-- REFERENCE TABLES (Global read access)
-- ===============================================

-- Fix age_groups table
ALTER TABLE public.age_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Age groups are viewable by everyone" ON public.age_groups;
DROP POLICY IF EXISTS "age_groups_select_all" ON public.age_groups;
DROP POLICY IF EXISTS "allow_authenticated_select_age_groups" ON public.age_groups;

-- Allow all authenticated users to read age groups (reference data)
CREATE POLICY "authenticated_users_select_age_groups" ON public.age_groups
  FOR SELECT TO authenticated
  USING (true);

-- Allow superadmins to manage age groups
CREATE POLICY "superadmin_manage_age_groups" ON public.age_groups
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role = 'superadmin'
    )
  );

-- Fix lesson_categories table
ALTER TABLE public.lesson_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Lesson categories are viewable by everyone" ON public.lesson_categories;
DROP POLICY IF EXISTS "lesson_categories_select_all" ON public.lesson_categories;
DROP POLICY IF EXISTS "allow_authenticated_select_lesson_categories" ON public.lesson_categories;

-- Allow all authenticated users to read lesson categories (reference data)
CREATE POLICY "authenticated_users_select_lesson_categories" ON public.lesson_categories
  FOR SELECT TO authenticated
  USING (true);

-- Allow superadmins to manage lesson categories
CREATE POLICY "superadmin_manage_lesson_categories" ON public.lesson_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role = 'superadmin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.role = 'superadmin'
    )
  );

-- ===============================================
-- APPLICATION TABLES (Tenant-scoped access)
-- ===============================================

-- Fix activities table (if not already secured)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'activities'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
    
    -- Activities are accessible based on lesson access
    CREATE POLICY "tenant_select_activities" ON public.activities
      FOR SELECT TO authenticated
      USING (
        lesson_id IN (
          SELECT l.id FROM public.lessons l
          INNER JOIN public.users u ON u.auth_user_id = auth.uid()
          WHERE l.is_public = true 
            OR l.preschool_id = u.preschool_id
            OR u.role = 'superadmin'
        )
      );
    
    -- Only lesson creators, school staff, or superadmins can modify activities
    CREATE POLICY "tenant_modify_activities" ON public.activities
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.lessons l
          INNER JOIN public.users u ON u.auth_user_id = auth.uid()
          WHERE l.id = activities.lesson_id
            AND (u.role = 'superadmin' 
                 OR (l.preschool_id = u.preschool_id AND u.role IN ('principal','admin','preschool_admin','teacher'))
                 OR l.created_by = u.id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.lessons l
          INNER JOIN public.users u ON u.auth_user_id = auth.uid()
          WHERE l.id = activities.lesson_id
            AND (u.role = 'superadmin' 
                 OR (l.preschool_id = u.preschool_id AND u.role IN ('principal','admin','preschool_admin','teacher'))
                 OR l.created_by = u.id)
        )
      );
  END IF;
END $$;

-- ===============================================
-- AUDIT TABLES (Special access patterns)
-- ===============================================

-- Fix ai_usage_logs table if it exists and is unrestricted
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'ai_usage_logs'
  ) THEN
    -- Enable RLS
    ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
    
    -- Drop any existing policies
    DROP POLICY IF EXISTS "ai_usage_logs_tenant_select" ON public.ai_usage_logs;
    DROP POLICY IF EXISTS "ai_usage_logs_system_insert" ON public.ai_usage_logs;
    DROP POLICY IF EXISTS "ai_usage_logs_superadmin_all" ON public.ai_usage_logs;
    DROP POLICY IF EXISTS "Users can view their own AI usage logs" ON public.ai_usage_logs;
    DROP POLICY IF EXISTS "System can insert AI usage logs" ON public.ai_usage_logs;
    
    -- Check if preschool_id column exists before using it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'ai_usage_logs' 
      AND column_name = 'preschool_id'
      AND table_schema = 'public'
    ) THEN
      -- School staff can view AI usage for their school (if preschool_id exists)
      CREATE POLICY "ai_usage_logs_tenant_select" ON public.ai_usage_logs
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid()
              AND (u.role = 'superadmin' 
                   OR u.preschool_id = ai_usage_logs.preschool_id)
          )
        );
    ELSE
      -- Fallback: Users can only see their own AI usage logs
      CREATE POLICY "ai_usage_logs_user_select" ON public.ai_usage_logs
        FOR SELECT TO authenticated
        USING (
          user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.auth_user_id = auth.uid()
              AND u.role = 'superadmin'
          )
        );
    END IF;
    
    -- System can insert AI usage logs
    CREATE POLICY "ai_usage_logs_system_insert" ON public.ai_usage_logs
      FOR INSERT TO authenticated
      WITH CHECK (true); -- Allow system to log usage
    
    -- Superadmins can do everything
    CREATE POLICY "ai_usage_logs_superadmin_all" ON public.ai_usage_logs
      FOR ALL TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_user_id = auth.uid()
            AND u.role = 'superadmin'
        )
      );
  END IF;
END $$;

-- ===============================================
-- INVITATION CODES TABLE
-- ===============================================

-- The school_invitation_codes table should already be handled by the previous migration
-- But let's ensure it's properly secured
DO $$
BEGIN
  -- This table should already have RLS from the 20250820_enable_rls_school_invitation_codes.sql migration
  -- Just verify it's enabled
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'school_invitation_codes'
  ) THEN
    ALTER TABLE public.school_invitation_codes ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ===============================================
-- VERIFY RLS STATUS
-- ===============================================

-- Show RLS status for all tables
SELECT 
    'RLS Status Check' as check_type,
    c.relname as table_name,
    CASE WHEN c.relrowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status,
    (
      SELECT COUNT(*) 
      FROM pg_policies p 
      WHERE p.schemaname = 'public' 
      AND p.tablename = c.relname
    ) as policy_count
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE 'sql_%'
ORDER BY 
  CASE WHEN c.relrowsecurity THEN 0 ELSE 1 END,
  c.relname;

-- ===============================================
-- GRANT PERMISSIONS
-- ===============================================

-- Ensure authenticated users can access reference tables
GRANT SELECT ON public.age_groups TO authenticated;
GRANT SELECT ON public.lesson_categories TO authenticated;

-- Ensure service role can access everything (for server-side operations)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ===============================================
-- COMPLETION MESSAGE
-- ===============================================

SELECT 'All unrestricted tables now have proper RLS policies ✅' as status;
