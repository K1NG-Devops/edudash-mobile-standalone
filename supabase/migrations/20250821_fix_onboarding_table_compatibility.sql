-- Fix onboarding table compatibility
-- This ensures the frontend can read onboarding requests regardless of table name

-- Check what onboarding table exists and create compatibility view
DO $$
DECLARE
    has_preschool_onboarding_requests boolean := false;
    has_onboarding_requests boolean := false;
BEGIN
    -- Check if preschool_onboarding_requests table exists
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'preschool_onboarding_requests'
    ) INTO has_preschool_onboarding_requests;
    
    -- Check if onboarding_requests table exists  
    SELECT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'onboarding_requests'
    ) INTO has_onboarding_requests;
    
    RAISE NOTICE 'Table status: preschool_onboarding_requests=%, onboarding_requests=%', 
        has_preschool_onboarding_requests, has_onboarding_requests;
    
    -- If we have preschool_onboarding_requests but no onboarding_requests, create a view
    IF has_preschool_onboarding_requests AND NOT has_onboarding_requests THEN
        RAISE NOTICE 'Creating onboarding_requests view pointing to preschool_onboarding_requests';
        
        CREATE OR REPLACE VIEW public.onboarding_requests AS 
        SELECT 
            id,
            preschool_name,
            admin_name, 
            admin_email,
            phone,
            address,
            number_of_students,
            number_of_teachers,
            message,
            status,
            reviewed_by,
            reviewed_at,
            created_at
        FROM public.preschool_onboarding_requests;
        
        -- Grant permissions on the view
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_requests TO authenticated;
        GRANT ALL ON public.onboarding_requests TO service_role;
    END IF;
    
    -- If we have onboarding_requests but no preschool_onboarding_requests, create a view the other way
    IF has_onboarding_requests AND NOT has_preschool_onboarding_requests THEN
        RAISE NOTICE 'Creating preschool_onboarding_requests view pointing to onboarding_requests';
        
        CREATE OR REPLACE VIEW public.preschool_onboarding_requests AS 
        SELECT 
            id,
            preschool_name,
            admin_name, 
            admin_email,
            phone,
            address,
            number_of_students,
            number_of_teachers,
            message,
            status,
            reviewed_by,
            reviewed_at,
            created_at
        FROM public.onboarding_requests;
        
        -- Grant permissions on the view
        GRANT SELECT, INSERT, UPDATE, DELETE ON public.preschool_onboarding_requests TO authenticated;
        GRANT ALL ON public.preschool_onboarding_requests TO service_role;
    END IF;
    
END $$;

-- Ensure RLS is enabled on the actual table (not the view)
DO $$
BEGIN
    -- Enable RLS on preschool_onboarding_requests if it exists
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'preschool_onboarding_requests'
    ) THEN
        ALTER TABLE public.preschool_onboarding_requests ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for superadmin access
        DROP POLICY IF EXISTS "superadmin_access_onboarding_requests" ON public.preschool_onboarding_requests;
        CREATE POLICY "superadmin_access_onboarding_requests" ON public.preschool_onboarding_requests
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
    END IF;
    
    -- Enable RLS on onboarding_requests if it exists
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'onboarding_requests'
    ) THEN
        ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for superadmin access
        DROP POLICY IF EXISTS "superadmin_access_onboarding_requests" ON public.onboarding_requests;
        CREATE POLICY "superadmin_access_onboarding_requests" ON public.onboarding_requests
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
    END IF;
END $$;

-- Show current onboarding data for debugging
SELECT 
    'Current onboarding requests:' as info,
    (
        SELECT COALESCE(
            (SELECT COUNT(*) FROM public.preschool_onboarding_requests WHERE status = 'pending'),
            (SELECT COUNT(*) FROM public.onboarding_requests WHERE status = 'pending'),
            0
        )
    ) as pending_count;

SELECT 'Onboarding table compatibility setup complete ✅' as status;
