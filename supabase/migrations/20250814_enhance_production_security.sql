-- Enhanced security policies and functions for production
-- This migration improves RLS policies and adds additional security measures

-- Function to check if user belongs to preschool (secure helper)
CREATE OR REPLACE FUNCTION user_belongs_to_preschool(preschool_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE auth_user_id = auth.uid() 
        AND preschool_id = preschool_uuid 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE auth_user_id = auth.uid() 
        AND role = 'superadmin' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin or higher
CREATE OR REPLACE FUNCTION is_admin_or_higher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE auth_user_id = auth.uid() 
        AND role IN ('superadmin', 'admin', 'principal') 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user's preschool ID
CREATE OR REPLACE FUNCTION get_current_user_preschool_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT preschool_id FROM users 
        WHERE auth_user_id = auth.uid() 
        AND is_active = true
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced RLS policy for preschool_onboarding_requests
-- Only super admins can manage onboarding requests
DROP POLICY IF EXISTS "Users can view preschool onboarding requests from their preschool" ON preschool_onboarding_requests;
CREATE POLICY "Super admins can manage onboarding requests" ON preschool_onboarding_requests
    FOR ALL USING (is_super_admin());

-- Enhanced RLS policy for users - more restrictive
DROP POLICY IF EXISTS "users_policy" ON users;
CREATE POLICY "Enhanced users policy" ON users
    FOR SELECT USING (
        -- Users can see themselves
        auth_user_id = auth.uid() OR
        -- Super admins can see all users
        is_super_admin() OR
        -- Users can see other users from their preschool (but not sensitive data)
        (preschool_id = get_current_user_preschool_id() AND preschool_id IS NOT NULL)
    );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());

-- Only super admins and preschool admins can create users
CREATE POLICY "Admins can create users" ON users
    FOR INSERT WITH CHECK (
        is_super_admin() OR 
        is_admin_or_higher()
    );

-- Enhanced students policy - parents can only see their own children
DROP POLICY IF EXISTS "students_policy" ON students;
CREATE POLICY "Enhanced students policy" ON students
    FOR SELECT USING (
        -- Super admins can see all students
        is_super_admin() OR
        -- Preschool staff can see students from their preschool
        (
            preschool_id = get_current_user_preschool_id() 
            AND EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role IN ('admin', 'principal', 'teacher')
                AND is_active = true
            )
        ) OR
        -- Parents can only see their own children
        (
            parent_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
            AND EXISTS (
                SELECT 1 FROM users 
                WHERE auth_user_id = auth.uid() 
                AND role = 'parent'
                AND is_active = true
            )
        )
    );

-- Only preschool staff can create/update students
CREATE POLICY "Staff can manage students" ON students
    FOR INSERT WITH CHECK (
        is_super_admin() OR
        (is_admin_or_higher() AND preschool_id = get_current_user_preschool_id())
    );

CREATE POLICY "Staff can update students" ON students
    FOR UPDATE USING (
        is_super_admin() OR
        (
            is_admin_or_higher() 
            AND preschool_id = get_current_user_preschool_id()
        )
    );

-- Enhanced notifications policy to include preschool admins
DROP POLICY IF EXISTS "Super admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        -- System/service role can always insert
        auth.role() = 'service_role' OR
        -- Super admins can insert any notification
        is_super_admin() OR
        -- Preschool admins can insert notifications for their preschool users
        (
            is_admin_or_higher() 
            AND user_id IN (
                SELECT id FROM users 
                WHERE preschool_id = get_current_user_preschool_id()
                AND is_active = true
            )
        )
    );

-- Enhanced activity logs policy
DROP POLICY IF EXISTS "Super admins can insert activity logs" ON activity_logs;
CREATE POLICY "Enhanced activity logs insert" ON activity_logs
    FOR INSERT WITH CHECK (
        -- System/service role can always insert
        auth.role() = 'service_role' OR
        -- Super admins can insert any activity log
        is_super_admin() OR
        -- Users can insert their own activity logs
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        -- Preschool admins can insert logs for their preschool users
        (
            is_admin_or_higher() 
            AND user_id IN (
                SELECT id FROM users 
                WHERE preschool_id = get_current_user_preschool_id()
                AND is_active = true
            )
        )
    );

-- Grant permissions to security functions
GRANT EXECUTE ON FUNCTION user_belongs_to_preschool(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin_or_higher() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_preschool_id() TO authenticated;

-- Add security comments
COMMENT ON FUNCTION user_belongs_to_preschool(UUID) IS 'Check if current user belongs to specified preschool';
COMMENT ON FUNCTION is_super_admin() IS 'Check if current user is a super admin';
COMMENT ON FUNCTION is_admin_or_higher() IS 'Check if current user has admin privileges or higher';
COMMENT ON FUNCTION get_current_user_preschool_id() IS 'Get the preschool ID of the current authenticated user';

-- Create audit trigger function for sensitive operations
CREATE OR REPLACE FUNCTION audit_sensitive_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log sensitive changes to activity_logs
    IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'users' THEN
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            COALESCE(NEW.id, OLD.id),
            'user_profile_updated',
            'user',
            COALESCE(NEW.id, OLD.id),
            jsonb_build_object(
                'changed_by', (SELECT id FROM users WHERE auth_user_id = auth.uid()),
                'old_role', OLD.role,
                'new_role', NEW.role,
                'old_active', OLD.is_active,
                'new_active', NEW.is_active
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers for sensitive tables
CREATE TRIGGER audit_user_changes
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_sensitive_changes();

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_audit ON activity_logs(action, created_at DESC)
    WHERE action LIKE '%_updated' OR action LIKE '%_deleted';

COMMENT ON TRIGGER audit_user_changes ON users IS 'Audit trail for sensitive user profile changes';
