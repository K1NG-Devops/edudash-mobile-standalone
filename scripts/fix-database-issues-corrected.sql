-- =====================================================
-- EduDash Pro Database Fix Script (Corrected)
-- =====================================================

-- This script fixes the specific issues found:
-- 1. Fix infinite recursion in RLS policies
-- 2. Create missing tables 
-- 3. Create superadmin user

-- =====================================================
-- STEP 1: FIX RLS POLICIES (REMOVE INFINITE RECURSION)
-- =====================================================

-- Disable RLS and drop all problematic policies on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Superadmin can do everything" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "superadmin_all_users" ON users;
DROP POLICY IF EXISTS "users_own_data" ON users;

-- Re-enable RLS 
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policy
CREATE POLICY "users_access_policy" ON users
    FOR ALL USING (
        auth.uid()::text = auth_user_id
        OR 
        EXISTS (
            SELECT 1 FROM users superadmins
            WHERE superadmins.auth_user_id = auth.uid()::text 
            AND superadmins.role = 'superadmin' 
            AND superadmins.is_active = true
        )
    );

-- =====================================================
-- STEP 2: CREATE MISSING TABLES
-- =====================================================

-- Create missing CLASSROOM_REPORTS table
CREATE TABLE IF NOT EXISTS classroom_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preschool_id uuid NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
    
    -- Report metadata
    report_date date NOT NULL,
    report_type text NOT NULL DEFAULT 'daily',
    
    -- Content and activities
    activities_summary jsonb DEFAULT '[]'::jsonb,
    total_activities integer DEFAULT 0,
    learning_highlights text,
    skills_developed text[],
    
    -- Behavioral and social
    mood_rating integer CHECK (mood_rating BETWEEN 1 AND 5),
    behavior_notes text,
    social_interactions text,
    participation_level text,
    
    -- Health and care
    meals_eaten text[],
    nap_time_start timestamp with time zone,
    nap_time_end timestamp with time zone,
    bathroom_visits integer DEFAULT 0,
    diaper_changes integer DEFAULT 0,
    temperature_checks jsonb,
    health_observations text,
    medications_given text[],
    
    -- Incidents and follow-ups
    incidents text,
    areas_for_improvement text,
    next_steps text,
    follow_up_needed boolean DEFAULT false,
    
    -- Media and achievements
    photo_count integer DEFAULT 0,
    media_highlights text[],
    achievement_badges text[],
    
    -- Parent communication
    parent_message text,
    is_sent_to_parents boolean DEFAULT false,
    sent_at timestamp with time zone,
    parent_viewed_at timestamp with time zone,
    parent_acknowledgment text,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create missing INVITATION_CODES table
CREATE TABLE IF NOT EXISTS invitation_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('preschool_admin', 'teacher', 'parent')),
    preschool_id uuid NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
    used_at timestamp with time zone,
    used_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create missing EVENTS table  
CREATE TABLE IF NOT EXISTS events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    event_date date NOT NULL,
    event_time time,
    location text,
    event_type text,
    preschool_id uuid NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    is_mandatory boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create missing VIDEO_CALL_SESSIONS table
CREATE TABLE IF NOT EXISTS video_call_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    host_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preschool_id uuid NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    joined_participants jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- STEP 3: CREATE SUPERADMIN USER
-- =====================================================

-- Create the superadmin user using a simpler approach
INSERT INTO users (
    auth_user_id,
    email,
    name,
    role,
    is_active,
    profile_completion_status,
    profile_completed_at,
    created_at,
    updated_at
) VALUES (
    'temp_superadmin_' || extract(epoch from now())::bigint,
    'superadmin@edudashpro.org.za',
    'EduDash Pro Super Administrator',
    'superadmin',
    true,
    'complete',
    now(),
    now(),
    now()
) 
ON CONFLICT (email) DO UPDATE SET
    role = 'superadmin',
    name = 'EduDash Pro Super Administrator',
    is_active = true,
    profile_completion_status = 'complete',
    updated_at = now();

-- =====================================================
-- STEP 4: SET UP PROPER INDEXES FOR NEW TABLES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_classroom_reports_student_id ON classroom_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_reports_preschool_id ON classroom_reports(preschool_id);
CREATE INDEX IF NOT EXISTS idx_classroom_reports_report_date ON classroom_reports(report_date);

CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_email ON invitation_codes(email);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_preschool_id ON invitation_codes(preschool_id);

CREATE INDEX IF NOT EXISTS idx_events_preschool_id ON events(preschool_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);

CREATE INDEX IF NOT EXISTS idx_video_call_sessions_host_id ON video_call_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_preschool_id ON video_call_sessions(preschool_id);

-- =====================================================
-- STEP 5: SET UP RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE classroom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_sessions ENABLE ROW LEVEL SECURITY;

-- Simple access policies based on preschool membership
CREATE POLICY "classroom_reports_preschool_access" ON classroom_reports
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

CREATE POLICY "invitation_codes_preschool_access" ON invitation_codes
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

CREATE POLICY "events_preschool_access" ON events
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

CREATE POLICY "video_calls_preschool_access" ON video_call_sessions
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

-- =====================================================
-- STEP 6: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to link auth users to existing user records
CREATE OR REPLACE FUNCTION link_auth_user()
RETURNS trigger AS $$
BEGIN
    -- Check if there's an existing user with this email
    UPDATE users 
    SET auth_user_id = NEW.id::text,
        updated_at = now()
    WHERE email = NEW.email 
    AND auth_user_id LIKE 'temp_%';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT role FROM users WHERE auth_user_id = auth.uid()::text LIMIT 1;
$$;

-- Function to check if current user is superadmin
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql  
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE auth_user_id = auth.uid()::text 
        AND role = 'superadmin' 
        AND is_active = true
    );
$$;
