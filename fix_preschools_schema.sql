-- Add missing columns to preschools table for school management functionality
-- This fixes the "Could not find the 'onboarding_status' column" error

-- Add missing columns to preschools table
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS onboarding_status varchar(20) DEFAULT 'requested' CHECK (onboarding_status IN ('requested', 'approved', 'setup', 'completed'));
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS subscription_plan varchar(20) DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'premium', 'enterprise'));
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS subscription_status varchar(20) DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'inactive', 'cancelled'));
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS subscription_start_date date;
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS subscription_end_date date;
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS billing_email varchar(255);
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS max_students integer DEFAULT 50;
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS max_teachers integer DEFAULT 10;
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS setup_completed boolean DEFAULT false;
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS tenant_slug varchar(50) UNIQUE;
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS domain varchar(100);
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS timezone varchar(50) DEFAULT 'UTC';
ALTER TABLE public.preschools ADD COLUMN IF NOT EXISTS logo_url text;

-- Create school_invitation_codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.school_invitation_codes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(20) UNIQUE NOT NULL,
  school_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  invitation_type varchar(20) NOT NULL CHECK (invitation_type IN ('principal', 'teacher', 'parent')),
  invited_email varchar(255), -- For principal/teacher invitations
  invited_name varchar(255),   -- For principal/teacher invitations
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_school_invitation_codes_code ON public.school_invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_school_invitation_codes_school_id ON public.school_invitation_codes(school_id);
CREATE INDEX IF NOT EXISTS idx_preschools_tenant_slug ON public.preschools(tenant_slug);

-- Update the existing preschool if any to have proper defaults
UPDATE public.preschools 
SET 
  onboarding_status = COALESCE(onboarding_status, 'requested'),
  subscription_plan = COALESCE(subscription_plan, 'trial'),
  subscription_status = COALESCE(subscription_status, 'pending'),
  setup_completed = COALESCE(setup_completed, false),
  max_students = COALESCE(max_students, 50),
  max_teachers = COALESCE(max_teachers, 10),
  timezone = COALESCE(timezone, 'UTC')
WHERE id IS NOT NULL;

-- Generate unique tenant_slug for existing preschools if they don't have one
UPDATE public.preschools 
SET tenant_slug = lower(replace(replace(name, ' ', '-'), '''', '')) || '-' || substring(id::text from 1 for 8)
WHERE tenant_slug IS NULL;

NOTICE 'Added missing columns to preschools table and created school_invitation_codes table';
