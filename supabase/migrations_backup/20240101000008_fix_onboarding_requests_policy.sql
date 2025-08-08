-- Allow anyone to submit preschool onboarding requests
CREATE POLICY "Anyone can submit onboarding requests" ON preschool_onboarding_requests
    FOR INSERT WITH CHECK (true);

-- Allow system admins to view all onboarding requests
CREATE POLICY "System admins can view all onboarding requests" ON preschool_onboarding_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'system_admin'
        )
    );

-- Allow system admins to update onboarding requests
CREATE POLICY "System admins can update onboarding requests" ON preschool_onboarding_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'system_admin'
        )
    );
