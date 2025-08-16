-- =====================================================
-- Step-by-Step Database Fix for EduDash Pro
-- =====================================================
-- Run each section separately if you encounter errors

-- =====================================================
-- STEP 1: Fix RLS Policies (Run this first)
-- =====================================================

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "users_own_data" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new non-recursive policy
CREATE POLICY "users_simple_access" ON users
    FOR ALL USING (
        auth.uid()::text = auth_user_id
        OR 
        (auth.uid()::text IN (
            SELECT auth_user_id FROM users u2
            WHERE u2.role = 'superadmin' AND u2.is_active = true
        ))
    );

-- =====================================================
-- STEP 2: Create Superadmin User (Run this second)
-- =====================================================

INSERT INTO users (
    auth_user_id,
    email,
    name,
    role,
    is_active,
    profile_completion_status,
    created_at,
    updated_at
) VALUES (
    'temp_superadmin_1734222481',  -- Static temp ID
    'superadmin@edudashpro.org.za',
    'EduDash Pro Super Administrator',
    'superadmin',
    true,
    'complete',
    now(),
    now()
) 
ON CONFLICT (email) DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now();

-- =====================================================
-- STEP 3: Create Missing Tables (Run this third)
-- =====================================================

-- Create CLASSROOM_REPORTS table
CREATE TABLE IF NOT EXISTS classroom_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preschool_id uuid NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
    report_date date NOT NULL DEFAULT current_date,
    report_type text NOT NULL DEFAULT 'daily',
    activities_summary jsonb DEFAULT '[]'::jsonb,
    total_activities integer DEFAULT 0,
    learning_highlights text,
    skills_developed text[],
    mood_rating integer CHECK (mood_rating BETWEEN 1 AND 5),
    behavior_notes text,
    social_interactions text,
    participation_level text,
    meals_eaten text[],
    nap_time_start timestamp with time zone,
    nap_time_end timestamp with time zone,
    bathroom_visits integer DEFAULT 0,
    diaper_changes integer DEFAULT 0,
    temperature_checks jsonb,
    health_observations text,
    medications_given text[],
    incidents text,
    areas_for_improvement text,
    next_steps text,
    follow_up_needed boolean DEFAULT false,
    photo_count integer DEFAULT 0,
    media_highlights text[],
    achievement_badges text[],
    parent_message text,
    is_sent_to_parents boolean DEFAULT false,
    sent_at timestamp with time zone,
    parent_viewed_at timestamp with time zone,
    parent_acknowledgment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create INVITATION_CODES table
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

-- Create EVENTS table
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

-- Create VIDEO_CALL_SESSIONS table
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
-- STEP 4: Create Indexes (Run this fourth) 
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_classroom_reports_student_id ON classroom_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_reports_preschool_id ON classroom_reports(preschool_id);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_preschool_id ON invitation_codes(preschool_id);
CREATE INDEX IF NOT EXISTS idx_events_preschool_id ON events(preschool_id);
CREATE INDEX IF NOT EXISTS idx_video_call_sessions_host_id ON video_call_sessions(host_id);

-- =====================================================
-- STEP 5: Enable RLS on New Tables (Run this last)
-- =====================================================

-- Enable RLS
ALTER TABLE classroom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_sessions ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "classroom_reports_access" ON classroom_reports
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

CREATE POLICY "invitation_codes_access" ON invitation_codes
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

CREATE POLICY "events_access" ON events
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );

CREATE POLICY "video_calls_access" ON video_call_sessions
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM users 
            WHERE auth_user_id = auth.uid()::text
        )
    );
