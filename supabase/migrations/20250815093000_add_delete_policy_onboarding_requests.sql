-- Add DELETE policy for preschool_onboarding_requests table
-- This fixes the issue where superadmins couldn't delete rejected onboarding requests
-- Also fixes circular reference issues in existing policies

-- Fix all policies to use JWT role directly instead of querying users table
-- This avoids infinite recursion issues

-- Allow superadmins to view all onboarding requests
DROP POLICY IF EXISTS "Superadmins can view all onboarding requests" ON preschool_onboarding_requests;
CREATE POLICY "Superadmins can view all onboarding requests" ON preschool_onboarding_requests
    FOR SELECT USING (
        (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Allow superadmins to update onboarding requests
DROP POLICY IF EXISTS "Superadmins can update onboarding requests" ON preschool_onboarding_requests;
CREATE POLICY "Superadmins can update onboarding requests" ON preschool_onboarding_requests
    FOR UPDATE USING (
        (auth.jwt() ->> 'role') = 'superadmin'
    );

-- Allow superadmins to delete onboarding requests
DROP POLICY IF EXISTS "Superadmins can delete onboarding requests" ON preschool_onboarding_requests;
CREATE POLICY "Superadmins can delete onboarding requests" ON preschool_onboarding_requests
    FOR DELETE USING (
        (auth.jwt() ->> 'role') = 'superadmin'
    );
