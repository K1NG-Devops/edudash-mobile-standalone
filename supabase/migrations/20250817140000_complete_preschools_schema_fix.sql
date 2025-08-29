-- Complete fix for all missing preschools table columns
-- This ensures all columns needed by the app are present

DO $$
BEGIN
    RAISE NOTICE 'Starting comprehensive preschools table column check...';

    -- Add setup_completed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'setup_completed'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN setup_completed boolean DEFAULT false;
        RAISE NOTICE 'Added setup_completed column';
    ELSE
        RAISE NOTICE 'setup_completed column already exists';
    END IF;

    -- Add max_students column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'max_students'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN max_students integer DEFAULT 50;
        RAISE NOTICE 'Added max_students column';
    ELSE
        RAISE NOTICE 'max_students column already exists';
    END IF;

    -- Add max_teachers column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'max_teachers'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN max_teachers integer DEFAULT 10;
        RAISE NOTICE 'Added max_teachers column';
    ELSE
        RAISE NOTICE 'max_teachers column already exists';
    END IF;

    -- Add billing_email column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'billing_email'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN billing_email varchar(255);
        RAISE NOTICE 'Added billing_email column';
    ELSE
        RAISE NOTICE 'billing_email column already exists';
    END IF;

    -- Add subscription_start_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'subscription_start_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN subscription_start_date date;
        RAISE NOTICE 'Added subscription_start_date column';
    ELSE
        RAISE NOTICE 'subscription_start_date column already exists';
    END IF;

    -- Add subscription_end_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'subscription_end_date'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN subscription_end_date date;
        RAISE NOTICE 'Added subscription_end_date column';
    ELSE
        RAISE NOTICE 'subscription_end_date column already exists';
    END IF;

    -- Add domain column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'domain'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN domain varchar(100);
        RAISE NOTICE 'Added domain column';
    ELSE
        RAISE NOTICE 'domain column already exists';
    END IF;

    -- Add timezone column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'timezone'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN timezone varchar(50) DEFAULT 'UTC';
        RAISE NOTICE 'Added timezone column';
    ELSE
        RAISE NOTICE 'timezone column already exists';
    END IF;

    -- Add logo_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'preschools' 
        AND column_name = 'logo_url'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.preschools 
        ADD COLUMN logo_url text;
        RAISE NOTICE 'Added logo_url column';
    ELSE
        RAISE NOTICE 'logo_url column already exists';
    END IF;

    RAISE NOTICE 'Comprehensive preschools table column check completed';
END $$;

-- Create school_invitation_codes table if missing
CREATE TABLE IF NOT EXISTS public.school_invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(20) UNIQUE NOT NULL,
  school_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  invitation_type varchar(20) NOT NULL CHECK (invitation_type IN ('principal', 'teacher', 'parent')),
  invited_email varchar(255),
  invited_name varchar(255),
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_school_invitation_codes_code ON public.school_invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_school_invitation_codes_school_id ON public.school_invitation_codes(school_id);

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'preschools' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
