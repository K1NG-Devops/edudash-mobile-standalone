-- Finalize Admin Setup Migration
-- This ensures all required components are in place for the new admin system

-- First, check if the admin_roles table exists (from 002-admin-permissions-system.sql)
-- If not, create the essential components

-- Ensure we have the admin system tables
DO $$
BEGIN
    -- Check if admin_roles exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_roles') THEN
        -- Create admin roles table
        CREATE TABLE admin_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            is_system_role BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create permissions table
        CREATE TABLE permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            category VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create role permissions junction table
        CREATE TABLE role_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            role_id UUID NOT NULL REFERENCES admin_roles(id) ON DELETE CASCADE,
            permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            granted_by UUID REFERENCES users(id),
            UNIQUE(role_id, permission_id)
        );
        
        RAISE NOTICE 'Created admin permission tables';
    END IF;
    
    -- Check if admin_role_id column exists in users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'admin_role_id'
    ) THEN
        ALTER TABLE users ADD COLUMN admin_role_id UUID REFERENCES admin_roles(id);
        RAISE NOTICE 'Added admin_role_id column to users table';
    END IF;
END $$;

-- Ensure we have all the permissions
INSERT INTO permissions (name, description, category) VALUES
-- Tenant Management
('view_tenants', 'View all tenants/preschools', 'tenants'),
('create_tenants', 'Create new tenants manually', 'tenants'),
('update_tenants', 'Update tenant information', 'tenants'),
('delete_tenants', 'Delete/deactivate tenants', 'tenants'),
('manage_tenant_subscriptions', 'Update subscription plans and billing', 'tenants'),

-- Onboarding Management
('view_onboarding_requests', 'View onboarding requests', 'onboarding'),
('approve_onboarding_requests', 'Approve onboarding requests', 'onboarding'),
('reject_onboarding_requests', 'Reject onboarding requests', 'onboarding'),

-- User Management
('view_all_users', 'View all users across all tenants', 'users'),
('manage_platform_admins', 'Add/remove/update platform administrators', 'users'),
('reset_user_passwords', 'Reset passwords for any user', 'users'),
('impersonate_users', 'Login as any user for support', 'users'),

-- System Management
('view_system_analytics', 'View system-wide analytics and reports', 'system'),
('manage_system_settings', 'Update global system settings', 'system'),
('view_system_logs', 'Access system logs and audit trails', 'system'),
('manage_database', 'Database administration and backups', 'system'),

-- Communication
('send_system_notifications', 'Send system-wide notifications', 'communication'),
('manage_email_templates', 'Edit system email templates', 'communication'),

-- Security
('view_security_logs', 'View security and authentication logs', 'security'),
('manage_security_settings', 'Update security policies', 'security'),

-- Support
('access_support_tools', 'Access customer support tools', 'support'),
('view_tenant_data', 'View detailed tenant data for support', 'support')
ON CONFLICT (name) DO NOTHING;

-- Ensure we have the default admin roles
INSERT INTO admin_roles (name, description, is_system_role) VALUES
('Super Administrator', 'Full system access - all permissions', true),
('Tenant Manager', 'Manages tenant onboarding and basic tenant operations', true),
('Support Specialist', 'Provides customer support with limited access', true),
('Analytics Viewer', 'Read-only access to analytics and reports', true),
('System Monitor', 'Monitors system health and performance', true)
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to Super Administrator (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_roles WHERE name = 'Super Administrator'),
    p.id
FROM permissions p
ON CONFLICT DO NOTHING;

-- Assign permissions to other roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_roles WHERE name = 'Tenant Manager'),
    p.id
FROM permissions p
WHERE p.name IN (
    'view_tenants', 'create_tenants', 'update_tenants',
    'view_onboarding_requests', 'approve_onboarding_requests', 'reject_onboarding_requests',
    'manage_tenant_subscriptions'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_roles WHERE name = 'Support Specialist'),
    p.id
FROM permissions p
WHERE p.name IN (
    'view_tenants', 'view_all_users', 'reset_user_passwords',
    'access_support_tools', 'view_tenant_data', 'send_system_notifications'
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_roles WHERE name = 'Analytics Viewer'),
    p.id
FROM permissions p
WHERE p.name IN ('view_tenants', 'view_system_analytics', 'view_system_logs')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM admin_roles WHERE name = 'System Monitor'),
    p.id
FROM permissions p
WHERE p.name IN (
    'view_system_analytics', 'view_system_logs', 'view_security_logs', 'manage_database'
)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_users_admin_role_id ON users(admin_role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);

-- Create helper functions if they don't exist
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users u
        JOIN admin_roles ar ON u.admin_role_id = ar.id
        JOIN role_permissions rp ON ar.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = user_id 
        AND p.name = permission_name
        AND u.is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name VARCHAR, category VARCHAR, description TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.name, p.category, p.description
    FROM users u
    JOIN admin_roles ar ON u.admin_role_id = ar.id
    JOIN role_permissions rp ON ar.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = user_id 
    AND u.is_active = true
    ORDER BY p.category, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing superadmin users to have Super Administrator role
UPDATE users 
SET admin_role_id = (SELECT id FROM admin_roles WHERE name = 'Super Administrator')
WHERE role = 'superadmin' AND admin_role_id IS NULL;

-- Enable RLS on new tables
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin management
DROP POLICY IF EXISTS "Superadmins can manage admin roles" ON admin_roles;
CREATE POLICY "Superadmins can manage admin roles" ON admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'superadmin' 
            AND u.is_active = true
        )
    );

DROP POLICY IF EXISTS "Superadmins can view permissions" ON permissions;
CREATE POLICY "Superadmins can view permissions" ON permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'superadmin' 
            AND u.is_active = true
        )
    );

DROP POLICY IF EXISTS "Superadmins can manage role permissions" ON role_permissions;
CREATE POLICY "Superadmins can manage role permissions" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'superadmin' 
            AND u.is_active = true
        )
    );

-- Update the main users table RLS policy to work with the new permission system
DROP POLICY IF EXISTS "Users can view users from their preschool" ON users;
DROP POLICY IF EXISTS "Comprehensive user access" ON users;

CREATE POLICY "Comprehensive user access with permissions" ON users
    FOR ALL 
    USING (
        -- Superadmins with manage_platform_admins permission can access everything
        EXISTS (
            SELECT 1 FROM users u 
            JOIN admin_roles ar ON u.admin_role_id = ar.id
            JOIN role_permissions rp ON ar.id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE u.auth_user_id = auth.uid() 
            AND p.name = 'manage_platform_admins'
            AND u.is_active = true
        )
        -- Users can access their own record
        OR auth_user_id = auth.uid()
        -- Users can view users from their own preschool
        OR (
            preschool_id IS NOT NULL 
            AND preschool_id IN (
                SELECT preschool_id FROM users 
                WHERE auth_user_id = auth.uid()
            )
        )
        -- Legacy: Regular superadmins (for backward compatibility)
        OR EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role = 'superadmin' 
            AND u.is_active = true
        )
    );

-- First, modify tenant_settings to allow NULL preschool_id for system-wide settings
ALTER TABLE tenant_settings ALTER COLUMN preschool_id DROP NOT NULL;

-- Add admin management link to the super admin dashboard
INSERT INTO tenant_settings (preschool_id, setting_key, setting_value)
SELECT 
    NULL as preschool_id,
    'admin_dashboard.show_admin_management' as setting_key,
    to_jsonb(true) as setting_value
WHERE NOT EXISTS (
    SELECT 1 FROM tenant_settings 
    WHERE setting_key = 'admin_dashboard.show_admin_management'
);

-- Success message
SELECT 'Admin permissions system setup completed successfully!' as message,
       (SELECT COUNT(*) FROM admin_roles) as total_roles,
       (SELECT COUNT(*) FROM permissions) as total_permissions,
       (SELECT COUNT(*) FROM users WHERE role = 'superadmin') as superadmin_users;
