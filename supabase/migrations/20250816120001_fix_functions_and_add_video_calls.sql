-- Fix existing functions and add video calls
-- This migration fixes the function conflicts and adds video calls

-- =============================================
-- DROP AND RECREATE FUNCTIONS WITH CORRECT TYPES
-- =============================================

-- Drop existing functions that conflict
DROP FUNCTION IF EXISTS get_active_connections();
DROP FUNCTION IF EXISTS superadmin_approve_onboarding(uuid);

-- =============================================
-- VIDEO CALLS AND COMMUNICATION
-- =============================================

-- Video calls table
CREATE TABLE IF NOT EXISTS video_calls (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  
  -- Meeting details
  meeting_id text UNIQUE,
  meeting_password text,
  meeting_url text,
  
  -- Scheduling
  scheduled_start timestamp with time zone NOT NULL,
  scheduled_end timestamp with time zone NOT NULL,
  actual_start timestamp with time zone,
  actual_end timestamp with time zone,
  
  -- Status
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  max_participants integer DEFAULT 50,
  
  -- Settings
  recording_enabled boolean DEFAULT false,
  recording_url text,
  waiting_room_enabled boolean DEFAULT true,
  require_password boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Video call participants
CREATE TABLE IF NOT EXISTS video_call_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id uuid NOT NULL REFERENCES video_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE, -- For parent-student associations
  
  -- Participation details
  joined_at timestamp with time zone,
  left_at timestamp with time zone,
  duration_minutes integer,
  
  -- Status
  invitation_sent boolean DEFAULT false,
  invitation_sent_at timestamp with time zone,
  status text DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left', 'removed')),
  
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(call_id, user_id)
);

-- Enable RLS on video call tables
ALTER TABLE video_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_participants ENABLE ROW LEVEL SECURITY;

-- Video calls policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'video_calls' 
      AND policyname = 'Users can view video calls in their preschool'
  ) THEN
    CREATE POLICY "Users can view video calls in their preschool" ON video_calls
      FOR SELECT USING (
        preschool_id IN (
          SELECT preschool_id FROM users 
          WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'video_calls' 
      AND policyname = 'Teachers can manage video calls'
  ) THEN
    CREATE POLICY "Teachers can manage video calls" ON video_calls
      FOR ALL USING (
        teacher_id IN (
          SELECT id FROM users 
          WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- Video call participants policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'video_call_participants' 
      AND policyname = 'Users can view their video call participations'
  ) THEN
    CREATE POLICY "Users can view their video call participations" ON video_call_participants
      FOR SELECT USING (
        user_id IN (
          SELECT id FROM users 
          WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- =============================================
-- RECREATE RPC FUNCTIONS WITH CORRECT TYPES
-- =============================================

-- Create get_active_connections with proper return type
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_preschool_id uuid;
  connections_data json;
BEGIN
  -- Get the current user's preschool
  SELECT preschool_id INTO user_preschool_id
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  -- Return active video calls for the user's preschool
  SELECT json_agg(
    json_build_object(
      'id', vc.id,
      'title', vc.title,
      'status', vc.status,
      'scheduled_start', vc.scheduled_start,
      'meeting_url', vc.meeting_url,
      'participants_count', (
        SELECT COUNT(*) 
        FROM video_call_participants vcp 
        WHERE vcp.call_id = vc.id
      )
    )
  ) INTO connections_data
  FROM video_calls vc
  WHERE vc.preschool_id = user_preschool_id
  AND vc.status IN ('scheduled', 'in_progress');
  
  RETURN COALESCE(connections_data, '[]'::json);
END;
$$;

-- Create superadmin_approve_onboarding function
CREATE OR REPLACE FUNCTION superadmin_approve_onboarding(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  request_exists boolean;
BEGIN
  -- Check if current user is superadmin
  SELECT role INTO current_user_role
  FROM users 
  WHERE auth_user_id = auth.uid();
  
  IF current_user_role != 'superadmin' THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Access denied: Superadmin role required'
    );
  END IF;
  
  -- Check if request exists
  SELECT EXISTS(
    SELECT 1 FROM preschool_onboarding_requests 
    WHERE id = request_id
  ) INTO request_exists;
  
  IF NOT request_exists THEN
    RETURN json_build_object(
      'success', false, 
      'message', 'Onboarding request not found'
    );
  END IF;
  
  -- Update the request status
  UPDATE preschool_onboarding_requests 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  WHERE id = request_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Onboarding request approved successfully'
  );
END;
$$;

-- Create a function to create superadmin user with correct auth_user_id
CREATE OR REPLACE FUNCTION create_superadmin_for_current_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  user_email text;
BEGIN
  -- Get current auth user email
  SELECT email INTO user_email
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- Insert or update user as superadmin
  INSERT INTO users (
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    profile_completion_status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    COALESCE(user_email, 'superadmin@edudash.pro'),
    'EduDash Super Administrator',
    'superadmin',
    auth.uid(),
    true,
    'complete',
    now(),
    now()
  )
  ON CONFLICT (auth_user_id) 
  DO UPDATE SET
    role = 'superadmin',
    is_active = true,
    updated_at = now()
  RETURNING id INTO user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Superadmin user created/updated successfully',
    'user_id', user_id
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_active_connections() TO authenticated;
GRANT EXECUTE ON FUNCTION superadmin_approve_onboarding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION create_superadmin_for_current_user() TO authenticated;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Video calls indexes
CREATE INDEX IF NOT EXISTS idx_video_calls_preschool_id ON video_calls(preschool_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_scheduled_start ON video_calls(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_video_calls_status ON video_calls(status);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_call_id ON video_call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_video_call_participants_user_id ON video_call_participants(user_id);

-- Comments
COMMENT ON TABLE video_calls IS 'Video conference calls for classes and meetings';
COMMENT ON TABLE video_call_participants IS 'Participants in video calls with join/leave tracking';
COMMENT ON FUNCTION get_active_connections() IS 'Returns active video calls for current user preschool';
COMMENT ON FUNCTION superadmin_approve_onboarding(uuid) IS 'Allows superadmins to approve preschool onboarding requests';
COMMENT ON FUNCTION create_superadmin_for_current_user() IS 'Creates/updates current authenticated user as superadmin';
