-- Enhanced multi-tenant schema with onboarding workflow
-- This migration adds features for tenant management and onboarding

-- Add tenant status and subscription management to preschools
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS tenant_slug VARCHAR(50) UNIQUE;
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS subscription_start_date DATE;
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS subscription_end_date DATE;
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS setup_completed BOOLEAN DEFAULT false;
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS domain VARCHAR(100);
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Create index on tenant_slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_preschools_tenant_slug ON preschools(tenant_slug);

-- Create tenant onboarding workflow table
CREATE TABLE IF NOT EXISTS tenant_onboarding_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    step_name VARCHAR(50) NOT NULL, -- 'basic_info', 'admin_setup', 'school_setup', 'billing', 'completed'
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    data JSONB, -- Store step-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_preschool_step ON tenant_onboarding_steps(preschool_id, step_name);

-- Create tenant settings table for customization
CREATE TABLE IF NOT EXISTS tenant_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(preschool_id, setting_key)
);

-- Create tenant invitations table
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('preschool_admin', 'teacher', 'parent')),
    invited_by UUID NOT NULL REFERENCES users(id),
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);

-- Update preschool_onboarding_requests to include more details
ALTER TABLE preschool_onboarding_requests ADD COLUMN IF NOT EXISTS preferred_slug VARCHAR(50);
ALTER TABLE preschool_onboarding_requests ADD COLUMN IF NOT EXISTS school_type VARCHAR(50);
ALTER TABLE preschool_onboarding_requests ADD COLUMN IF NOT EXISTS expected_students INTEGER;
ALTER TABLE preschool_onboarding_requests ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create superadmin management functions
CREATE OR REPLACE FUNCTION create_tenant_with_admin(
    p_name VARCHAR(255),
    p_email VARCHAR(255),
    p_admin_name VARCHAR(255),
    p_tenant_slug VARCHAR(50),
    p_subscription_plan VARCHAR(20) DEFAULT 'basic'
) RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
    admin_user_id UUID;
BEGIN
    -- Create the preschool (tenant)
    INSERT INTO preschools (name, email, tenant_slug, subscription_plan, subscription_status, onboarding_status)
    VALUES (p_name, p_email, p_tenant_slug, p_subscription_plan, 'active', 'setup')
    RETURNING id INTO tenant_id;
    
    -- Create onboarding steps
    INSERT INTO tenant_onboarding_steps (preschool_id, step_name, status) VALUES
    (tenant_id, 'basic_info', 'completed'),
    (tenant_id, 'admin_setup', 'pending'),
    (tenant_id, 'school_setup', 'pending'),
    (tenant_id, 'branding_setup', 'pending'),
    (tenant_id, 'billing', 'pending'),
    (tenant_id, 'completed', 'pending');
    
    -- Initialize default branding settings
    INSERT INTO tenant_settings (preschool_id, setting_key, setting_value) VALUES
    (tenant_id, 'branding.school_name', to_jsonb(p_name)),
    (tenant_id, 'branding.logo_url', to_jsonb(null::text)),
    (tenant_id, 'branding.primary_color', to_jsonb('#3b82f6')),
    (tenant_id, 'branding.secondary_color', to_jsonb('#f8fafc')),
    (tenant_id, 'branding.accent_color', to_jsonb('#10b981')),
    (tenant_id, 'branding.show_edudash_branding', to_jsonb(true)),
    (tenant_id, 'branding.dashboard_title', to_jsonb(p_name || ' Dashboard')),
    (tenant_id, 'branding.parent_portal_title', to_jsonb(p_name || ' Parent Portal'));
    
    -- Create invitation for admin user
    INSERT INTO tenant_invitations (preschool_id, email, role, invited_by, invitation_token, expires_at)
    VALUES (
        tenant_id, 
        p_email, 
        'preschool_admin', 
        (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1),
        encode(gen_random_bytes(32), 'hex'),
        NOW() + INTERVAL '7 days'
    );
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get tenant context for current user
CREATE OR REPLACE FUNCTION get_user_tenant_id(user_uuid UUID) RETURNS UUID AS $$
DECLARE
    tenant_id UUID;
BEGIN
    SELECT preschool_id INTO tenant_id 
    FROM users 
    WHERE auth_user_id = user_uuid;
    
    RETURN tenant_id;
END;
$$ LANGUAGE plpgsql;

-- Enhanced RLS Policies

-- Update users RLS policies for multi-tenant
DROP POLICY IF EXISTS "Users can view users from their preschool" ON users;
CREATE POLICY "Users can view users from their preschool" ON users
    FOR SELECT USING (
        -- Superadmins can see all users
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role = 'superadmin') OR
        -- Users can see users from their preschool
        preschool_id = get_user_tenant_id(auth.uid()) OR
        -- Users can see their own record
        auth_user_id = auth.uid()
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Tenant onboarding steps policies
ALTER TABLE tenant_onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all onboarding steps" ON tenant_onboarding_steps
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role = 'superadmin')
    );

CREATE POLICY "Preschool admins can view their onboarding steps" ON tenant_onboarding_steps
    FOR SELECT USING (
        preschool_id = get_user_tenant_id(auth.uid()) AND
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('preschool_admin', 'superadmin'))
    );

-- Tenant settings policies
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preschool admins can manage their tenant settings" ON tenant_settings
    FOR ALL USING (
        preschool_id = get_user_tenant_id(auth.uid()) AND
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('preschool_admin', 'superadmin'))
    );

-- Tenant invitations policies
ALTER TABLE tenant_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preschool admins can manage their invitations" ON tenant_invitations
    FOR ALL USING (
        preschool_id = get_user_tenant_id(auth.uid()) AND
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('preschool_admin', 'superadmin'))
    );

-- Allow public access to accept invitations (with token verification)
CREATE POLICY "Anyone can view invitations with valid token" ON tenant_invitations
    FOR SELECT USING (true);

-- Update preschool RLS for superadmin access
DROP POLICY IF EXISTS "Users can view their own preschool" ON preschools;
CREATE POLICY "Users can view their preschool" ON preschools
    FOR SELECT USING (
        -- Superadmins can see all preschools
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role = 'superadmin') OR
        -- Users can see their own preschool
        id = get_user_tenant_id(auth.uid())
    );

CREATE POLICY "Superadmins can manage all preschools" ON preschools
    FOR ALL USING (
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role = 'superadmin')
    );

CREATE POLICY "Preschool admins can update their preschool" ON preschools
    FOR UPDATE USING (
        id = get_user_tenant_id(auth.uid()) AND
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role = 'preschool_admin')
    );
