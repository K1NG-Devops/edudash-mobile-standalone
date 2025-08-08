-- Fix RLS policies to use correct column names (payer_id instead of parent_id for payments)
-- This migration specifically addresses the error: column "parent_id" does not exist in payments table

-- First, let's drop any existing payment policies that might be problematic
DROP POLICY IF EXISTS "parents_read_own_payments" ON public.payments;
DROP POLICY IF EXISTS "parents_create_own_payments" ON public.payments;
DROP POLICY IF EXISTS "school_staff_manage_preschool_payments" ON public.payments;

-- Now create the correct policies using payer_id instead of parent_id
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    -- Parents can read their own payments (using payer_id)
    EXECUTE 'CREATE POLICY "parents_read_own_payments" ON public.payments
      FOR SELECT
      TO authenticated
      USING (
        payer_id IN (
          SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
      )';
    
    -- Parents can create their own payments (using payer_id)
    EXECUTE 'CREATE POLICY "parents_create_own_payments" ON public.payments
      FOR INSERT
      TO authenticated
      WITH CHECK (
        payer_id IN (
          SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
      )';
    
    -- School staff can manage payments in their preschool
    EXECUTE 'CREATE POLICY "school_staff_manage_preschool_payments" ON public.payments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role IN (''admin'', ''principal'', ''teacher'')
          AND u.preschool_id = payments.preschool_id
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role IN (''admin'', ''principal'', ''teacher'')
          AND u.preschool_id = payments.preschool_id
        )
      )';
      
    -- Superadmins can manage all payments
    EXECUTE 'CREATE POLICY "superadmins_manage_all_payments" ON public.payments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role = ''superadmin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.auth_user_id = auth.uid() 
          AND u.role = ''superadmin''
        )
      )';
  ELSE
    RAISE NOTICE 'Payments table does not exist, skipping payment policies';
  END IF;
END $$;

-- Also ensure payments table has RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Grant permissions on payments table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
  END IF;
END $$;

SELECT 'Payment RLS policies fixed - now using payer_id instead of parent_id' as status;
