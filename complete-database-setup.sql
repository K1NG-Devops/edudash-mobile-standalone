-- =====================================================
-- Complete EduDash Pro Database Setup Script
-- =====================================================
-- This script creates all necessary tables for the resend functionality
-- with the correct table names that the app expects

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. SCHOOLS TABLE (what the app calls preschools)
-- =====================================================

CREATE TABLE IF NOT EXISTS schools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    address text,
    logo_url text,
    domain text,
    tenant_slug text,
    timezone text DEFAULT 'Africa/Johannesburg',
    billing_email text,
    subscription_plan text DEFAULT 'free',
    subscription_status text DEFAULT 'active',
    subscription_start_date timestamp with time zone DEFAULT now(),
    subscription_end_date timestamp with time zone,
    max_students integer DEFAULT 50,
    max_teachers integer DEFAULT 10,
    setup_completed boolean DEFAULT false,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 2. ADMIN_USERS TABLE (separate from regular users)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id text UNIQUE,
    email text NOT NULL UNIQUE,
    first_name text NOT NULL,
    last_name text NOT NULL,
    role text NOT NULL CHECK (role IN ('superadmin', 'preschool_admin', 'teacher', 'parent')),
    phone text,
    avatar_url text,
    is_active boolean DEFAULT true,
    school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
    
    -- Profile completion tracking
    profile_completed_at timestamp with time zone,
    profile_completion_status text DEFAULT 'incomplete' CHECK (profile_completion_status IN ('incomplete', 'in_progress', 'complete')),
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 3. ONBOARDING_REQUESTS TABLE (what the app expects)
-- =====================================================

CREATE TABLE IF NOT EXISTS onboarding_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name text NOT NULL,
    admin_first_name text NOT NULL,
    admin_last_name text NOT NULL,
    admin_email text NOT NULL,
    admin_phone text,
    school_address text,
    number_of_students integer,
    number_of_teachers integer,
    message text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
    reviewed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Schools policies
CREATE POLICY "superadmin_schools_all" ON schools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid()::text 
            AND role = 'superadmin' 
            AND is_active = true
        )
    );

CREATE POLICY "admin_schools_own" ON schools
    FOR SELECT USING (
        id IN (
            SELECT school_id FROM admin_users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

-- Admin users policies
CREATE POLICY "admin_users_own" ON admin_users
    FOR SELECT USING (auth_user_id = auth.uid()::text);

CREATE POLICY "admin_users_update_own" ON admin_users
    FOR UPDATE USING (auth_user_id = auth.uid()::text);

CREATE POLICY "admin_users_insert_own" ON admin_users
    FOR INSERT WITH CHECK (auth_user_id = auth.uid()::text);

CREATE POLICY "superadmin_all_admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users u2 
            WHERE u2.auth_user_id = auth.uid()::text 
            AND u2.role = 'superadmin'
            AND u2.is_active = true
        )
    );

-- Onboarding requests policies
CREATE POLICY "anyone_can_submit_onboarding" ON onboarding_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "superadmin_all_onboarding" ON onboarding_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid()::text 
            AND role = 'superadmin'
            AND is_active = true
        )
    );

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);
CREATE INDEX IF NOT EXISTS idx_schools_email ON schools(email);
CREATE INDEX IF NOT EXISTS idx_schools_status ON schools(status);

CREATE INDEX IF NOT EXISTS idx_admin_users_auth_user_id ON admin_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_school_id ON admin_users(school_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_email ON onboarding_requests(admin_email);

-- =====================================================
-- 7. CREATE SUPERADMIN USER
-- =====================================================

-- Insert the superadmin user
DO $$
DECLARE
    superadmin_id uuid;
    temp_auth_id text;
BEGIN
    -- Generate a temporary auth ID (will be replaced when user signs up)
    temp_auth_id := 'temp_' || gen_random_uuid()::text;
    
    -- Insert the superadmin user
    INSERT INTO admin_users (
        auth_user_id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        profile_completion_status,
        profile_completed_at,
        created_at,
        updated_at
    ) VALUES (
        temp_auth_id,
        'superadmin@edudashpro.org.za',
        'EduDash Pro',
        'Super Administrator',
        'superadmin',
        true,
        'complete',
        now(),
        now(),
        now()
    ) 
    ON CONFLICT (email) DO UPDATE SET
        role = 'superadmin',
        first_name = 'EduDash Pro',
        last_name = 'Super Administrator',
        is_active = true,
        profile_completion_status = 'complete',
        updated_at = now()
    RETURNING id INTO superadmin_id;
    
    RAISE NOTICE '✅ Created/Updated superadmin user with ID: %', superadmin_id;
END $$;

-- =====================================================
-- 8. CREATE SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample schools
INSERT INTO schools (name, email, phone, address, status) VALUES
    ('Little Stars Preschool', 'admin@littlestars.co.za', '+27 11 123 4567', '123 Main Street, Johannesburg', 'active'),
    ('Rainbow Kids Academy', 'contact@rainbowkids.co.za', '+27 21 987 6543', '456 Oak Avenue, Cape Town', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample preschool admin users
DO $$
DECLARE
    school1_id uuid;
    school2_id uuid;
BEGIN
    -- Get school IDs
    SELECT id INTO school1_id FROM schools WHERE name = 'Little Stars Preschool';
    SELECT id INTO school2_id FROM schools WHERE name = 'Rainbow Kids Academy';
    
    -- Insert preschool admins
    INSERT INTO admin_users (
        auth_user_id, email, first_name, last_name, role, school_id, is_active
    ) VALUES 
        ('temp_admin1_' || gen_random_uuid()::text, 'admin1@littlestars.co.za', 'Sarah', 'Johnson', 'preschool_admin', school1_id, true),
        ('temp_admin2_' || gen_random_uuid()::text, 'admin2@rainbowkids.co.za', 'Michael', 'Smith', 'preschool_admin', school2_id, true)
    ON CONFLICT (email) DO NOTHING;
END $$;

-- Insert sample onboarding requests (for testing resend functionality)
INSERT INTO onboarding_requests (
    school_name, admin_first_name, admin_last_name, admin_email, admin_phone, 
    school_address, number_of_students, number_of_teachers, message, status
) VALUES
    ('Sunshine Daycare', 'Emma', 'Williams', 'emma@sunshine.co.za', '+27 11 555 1234', 
     '789 Sun Street, Pretoria', 25, 3, 'We would like to join EduDash Pro', 'pending'),
    ('Happy Hearts Nursery', 'James', 'Brown', 'james@happyhearts.co.za', '+27 31 555 5678',
     '321 Heart Avenue, Durban', 40, 5, 'Looking forward to using your platform', 'pending')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to check current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT role FROM admin_users WHERE auth_user_id = auth.uid()::text LIMIT 1;
$$;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql  
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM admin_users 
        WHERE auth_user_id = auth.uid()::text 
        AND role = 'superadmin' 
        AND is_active = true
    );
$$;

-- =====================================================
-- 10. FINAL STATUS REPORT
-- =====================================================

DO $$
DECLARE
    school_count INTEGER;
    admin_count INTEGER;
    superadmin_count INTEGER;
    onboarding_count INTEGER;
    pending_count INTEGER;
BEGIN
    SELECT count(*) INTO school_count FROM schools;
    SELECT count(*) INTO admin_count FROM admin_users;
    SELECT count(*) INTO superadmin_count FROM admin_users WHERE role = 'superadmin';
    SELECT count(*) INTO onboarding_count FROM onboarding_requests;
    SELECT count(*) INTO pending_count FROM onboarding_requests WHERE status = 'pending';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DATABASE SETUP COMPLETE!';
    RAISE NOTICE '📊 Schools: %', school_count;
    RAISE NOTICE '👥 Admin users: %', admin_count; 
    RAISE NOTICE '🔑 Superadmins: %', superadmin_count;
    RAISE NOTICE '📝 Onboarding requests: %', onboarding_count;
    RAISE NOTICE '⏳ Pending requests: %', pending_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ All tables created with correct names';
    RAISE NOTICE '✅ RLS policies configured';
    RAISE NOTICE '✅ Sample data inserted';
    RAISE NOTICE '✅ Ready for resend functionality testing!';
    RAISE NOTICE '';
    RAISE NOTICE '🔐 SUPERADMIN LOGIN:';
    RAISE NOTICE 'Email: superadmin@edudashpro.org.za';
    RAISE NOTICE 'Password: #Olivia@17';
END $$;
