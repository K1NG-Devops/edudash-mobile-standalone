-- Enhanced Production Database Fixes
-- Includes data fixes, RLS policy enforcement, and security improvements

-- =====================================================
-- PART 1: DATA FIXES (Subscription dates & timezone)
-- =====================================================

-- 1. Fix missing subscription dates for existing schools
UPDATE public.preschools 
SET 
  subscription_start_date = created_at::date,
  subscription_end_date = (created_at::date + INTERVAL '30 days')::date,
  timezone = 'Africa/Johannesburg',
  updated_at = NOW()
WHERE subscription_start_date IS NULL;

-- =====================================================
-- PART 2: RLS POLICY FIXES (Fix 'Unrestricted' tables)
-- =====================================================

-- Enable RLS on commonly unrestricted tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create safe RLS policies for platform-wide tables

-- Subscription plans: readable by all authenticated users
CREATE POLICY IF NOT EXISTS "subscription_plans_read_all" 
ON public.subscription_plans FOR SELECT 
TO authenticated 
USING (true);

-- Plan quotas: readable by all authenticated users  
CREATE POLICY IF NOT EXISTS "plan_quotas_read_all"
ON public.plan_quotas FOR SELECT
TO authenticated
USING (true);

-- Activity logs: readable by superadmins only
CREATE POLICY IF NOT EXISTS "activity_logs_superadmin_only"
ON public.activity_logs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- Platform analytics: readable by superadmins only
CREATE POLICY IF NOT EXISTS "platform_analytics_superadmin_only"
ON public.platform_analytics FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- System settings: readable by superadmins only
CREATE POLICY IF NOT EXISTS "system_settings_superadmin_only"
ON public.system_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.auth_user_id = auth.uid() 
    AND users.role = 'superadmin'
  )
);

-- =====================================================
-- PART 3: SECURITY ENHANCEMENTS
-- =====================================================

-- Ensure all user-related tables have proper RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for users (if not exists)
CREATE POLICY IF NOT EXISTS "users_own_data_and_school_members"
ON public.users FOR ALL
TO authenticated
USING (
  auth.uid() = auth_user_id OR
  EXISTS (
    SELECT 1 FROM public.users viewer
    WHERE viewer.auth_user_id = auth.uid()
    AND (
      viewer.role = 'superadmin' OR
      (viewer.preschool_id = users.preschool_id AND viewer.preschool_id IS NOT NULL)
    )
  )
);

-- =====================================================
-- PART 4: VALIDATION QUERIES
-- =====================================================

-- Verify the data fixes
SELECT 
  'SCHOOLS_FIXED' as check_type,
  name,
  subscription_start_date,
  subscription_end_date,
  timezone,
  CASE 
    WHEN subscription_start_date IS NOT NULL AND timezone = 'Africa/Johannesburg' 
    THEN 'FIXED ✅' 
    ELSE 'NEEDS_ATTENTION ⚠️' 
  END as status
FROM public.preschools 
ORDER BY created_at;

-- Check RLS status
SELECT 
  'RLS_STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN 'SECURED ✅' 
    ELSE 'UNRESTRICTED ⚠️' 
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'preschools', 'students', 'messages', 'payments',
    'subscription_plans', 'plan_quotas', 'activity_logs',
    'platform_analytics', 'system_settings'
  )
ORDER BY tablename;

-- Check policy count
SELECT 
  'POLICY_COUNT' as check_type,
  schemaname,
  tablename,
  COUNT(policyname) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(policyname) > 0
ORDER BY policy_count DESC;

-- Final health check
SELECT 
  'HEALTH_CHECK' as check_type,
  COUNT(CASE WHEN subscription_start_date IS NOT NULL THEN 1 END) as schools_with_dates,
  COUNT(CASE WHEN timezone = 'Africa/Johannesburg' THEN 1 END) as schools_correct_timezone,
  COUNT(*) as total_schools
FROM public.preschools;
