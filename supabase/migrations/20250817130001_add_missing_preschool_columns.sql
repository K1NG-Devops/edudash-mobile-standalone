-- Add onboarding_status column to production preschools table
-- This migration specifically addresses the missing column error

-- Add the missing column if it doesn't exist
DO $$
BEGIN
    -- Check if onboarding_status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'onboarding_status'
        AND table_schema = 'public'
    ) THEN
        -- Add the missing column
        ALTER TABLE public.preschools 
        ADD COLUMN onboarding_status varchar(20) DEFAULT 'requested' 
        CHECK (onboarding_status IN ('requested', 'approved', 'setup', 'completed'));
        
        RAISE NOTICE 'Added onboarding_status column to preschools table';
    ELSE
        RAISE NOTICE 'onboarding_status column already exists';
    END IF;
END $$;

-- Also ensure other required columns exist
DO $$
BEGIN
    -- Add tenant_slug if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'tenant_slug'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN tenant_slug varchar(50);
        
        CREATE UNIQUE INDEX IF NOT EXISTS idx_preschools_tenant_slug_unique 
        ON public.preschools(tenant_slug) WHERE tenant_slug IS NOT NULL;
        
        RAISE NOTICE 'Added tenant_slug column to preschools table';
    END IF;

    -- Add subscription_plan if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'subscription_plan'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN subscription_plan varchar(20) DEFAULT 'trial' 
        CHECK (subscription_plan IN ('trial', 'basic', 'premium', 'enterprise'));
        
        RAISE NOTICE 'Added subscription_plan column to preschools table';
    END IF;

    -- Add subscription_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'subscription_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN subscription_status varchar(20) DEFAULT 'pending' 
        CHECK (subscription_status IN ('pending', 'active', 'inactive', 'cancelled'));
        
        RAISE NOTICE 'Added subscription_status column to preschools table';
    END IF;
END $$;
