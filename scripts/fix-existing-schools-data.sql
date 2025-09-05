-- Fix existing preschools data - Complete missing fields
-- Run this in Supabase SQL Editor to fix data quality issues

-- Update Fringe school with missing data
UPDATE public.preschools 
SET 
  tenant_slug = 'fringe',
  subscription_plan = 'trial',
  subscription_status = 'active',
  setup_completed = true,
  onboarding_status = 'completed',
  max_students = 50,
  max_teachers = 10,
  billing_email = email,
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
  timezone = 'Africa/Johannesburg',
  updated_at = NOW()
WHERE name = 'Fringe';

-- Update Young Eagles school with missing data  
UPDATE public.preschools 
SET 
  tenant_slug = 'young-eagles',
  subscription_plan = 'trial', 
  subscription_status = 'active',
  setup_completed = true,
  onboarding_status = 'completed',
  max_students = 50,
  max_teachers = 10,
  billing_email = email,
  subscription_start_date = CURRENT_DATE,
  subscription_end_date = CURRENT_DATE + INTERVAL '30 days',
  timezone = 'Africa/Johannesburg',
  updated_at = NOW()
WHERE name = 'Young Eagles';

-- Verify the updates
SELECT 
  id,
  name,
  tenant_slug,
  subscription_plan,
  subscription_status,
  setup_completed,
  onboarding_status,
  subscription_start_date,
  subscription_end_date
FROM public.preschools 
ORDER BY created_at;
