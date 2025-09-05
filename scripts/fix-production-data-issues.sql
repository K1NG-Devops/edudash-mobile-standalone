-- Fix Production Database Issues
-- Based on analysis of actual production data dump

-- 1. Fix missing subscription dates for existing schools
-- Set trial start date to creation date and end date 30 days later

UPDATE public.preschools 
SET 
  subscription_start_date = created_at::date,
  subscription_end_date = (created_at::date + INTERVAL '30 days')::date,
  timezone = 'Africa/Johannesburg',
  updated_at = NOW()
WHERE subscription_start_date IS NULL;

-- 2. Verify the fixes
SELECT 
  id,
  name,
  tenant_slug,
  subscription_plan,
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  timezone,
  setup_completed,
  onboarding_status,
  created_at
FROM public.preschools 
ORDER BY created_at;

-- 3. Check pending onboarding requests
SELECT 
  id,
  preschool_name,
  admin_name,
  admin_email,
  status,
  created_at
FROM public.preschool_onboarding_requests
WHERE status = 'pending'
ORDER BY created_at;

-- 4. Verify user associations are correct
SELECT 
  u.id,
  u.name,
  u.email,
  u.role,
  p.name as school_name,
  u.is_active
FROM public.users u
LEFT JOIN public.preschools p ON u.preschool_id = p.id
WHERE u.role IN ('principal', 'teacher', 'parent')
ORDER BY u.role, u.created_at;

-- 5. Check AI usage and billing preferences
SELECT 
  COUNT(*) as total_ai_usage_logs,
  COUNT(DISTINCT user_id) as unique_users_using_ai,
  SUM(tokens_used) as total_tokens,
  feature
FROM public.ai_usage_logs
GROUP BY feature
ORDER BY total_tokens DESC;

-- 6. Platform health check
SELECT 
  'Schools' as entity,
  COUNT(*) as count
FROM public.preschools
WHERE is_active = true

UNION ALL

SELECT 
  'Active Users' as entity,
  COUNT(*) as count  
FROM public.users
WHERE is_active = true

UNION ALL

SELECT 
  'Students' as entity,
  COUNT(*) as count
FROM public.students
WHERE is_active = true

UNION ALL

SELECT 
  'Messages' as entity,
  COUNT(*) as count
FROM public.messages
WHERE created_at > NOW() - INTERVAL '30 days';
