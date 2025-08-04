-- Media Uploads Table
CREATE TABLE IF NOT EXISTS public.media_uploads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text CHECK (file_type IN ('image', 'video', 'audio', 'document')) NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  classroom_activity_id uuid REFERENCES public.classroom_activities(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Classroom Activities Table
CREATE TABLE IF NOT EXISTS public.classroom_activities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  activity_type text CHECK (activity_type IN ('learning', 'play', 'meal', 'nap', 'outdoor', 'art', 'music', 'reading', 'other')) NOT NULL,
  student_ids uuid[] NOT NULL DEFAULT '{}',
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  location text,
  duration_minutes integer,
  materials_used text[],
  learning_objectives text[],
  observations text,
  achievements jsonb DEFAULT '{}',
  parent_feedback text,
  is_published boolean DEFAULT true,
  scheduled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Daily/Weekly Reports Table
CREATE TABLE IF NOT EXISTS public.classroom_reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  report_type text CHECK (report_type IN ('daily', 'weekly', 'monthly')) NOT NULL DEFAULT 'daily',
  report_date date NOT NULL,
  
  -- Activity Summary
  activities_summary jsonb DEFAULT '{}',
  total_activities integer DEFAULT 0,
  
  -- Behavioral Observations
  behavior_notes text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  participation_level text CHECK (participation_level IN ('low', 'moderate', 'high', 'excellent')),
  social_interactions text,
  
  -- Learning Progress
  learning_highlights text,
  skills_developed text[],
  areas_for_improvement text,
  achievement_badges text[],
  
  -- Daily Care
  meals_eaten text[],
  nap_time_start timestamptz,
  nap_time_end timestamptz,
  diaper_changes integer DEFAULT 0,
  bathroom_visits integer DEFAULT 0,
  
  -- Health & Wellness
  health_observations text,
  incidents text,
  medications_given text[],
  temperature_checks jsonb DEFAULT '[]',
  
  -- Parent Communication
  parent_message text,
  follow_up_needed boolean DEFAULT false,
  next_steps text,
  
  -- Media & Photos
  media_highlights uuid[] DEFAULT '{}',
  photo_count integer DEFAULT 0,
  
  -- Status
  is_sent_to_parents boolean DEFAULT false,
  sent_at timestamptz,
  parent_viewed_at timestamptz,
  parent_acknowledgment text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(student_id, report_date, report_type)
);

-- Video Call Sessions Table
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_type text CHECK (session_type IN ('parent_teacher', 'parent_meeting', 'staff_meeting', 'group_call')) NOT NULL,
  
  -- Participants
  invited_participants uuid[] NOT NULL DEFAULT '{}',
  joined_participants uuid[] NOT NULL DEFAULT '{}',
  
  -- Scheduling
  scheduled_start_time timestamptz NOT NULL,
  scheduled_end_time timestamptz NOT NULL,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  
  -- Meeting Details
  meeting_room_id text, -- External video service room ID
  meeting_url text,
  dial_in_number text,
  access_code text,
  
  -- Settings
  is_recorded boolean DEFAULT false,
  recording_url text,
  max_participants integer DEFAULT 10,
  require_waiting_room boolean DEFAULT true,
  allow_screen_sharing boolean DEFAULT true,
  
  -- Status
  status text CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  cancellation_reason text,
  
  -- Reminders
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency Alerts Table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type text CHECK (alert_type IN ('emergency', 'urgent', 'weather', 'security', 'health', 'closure', 'pickup_change')) NOT NULL,
  
  -- Alert Content
  title text NOT NULL,
  message text NOT NULL,
  instructions text,
  
  -- Targeting
  target_audience text CHECK (target_audience IN ('all_parents', 'class_parents', 'specific_parents', 'staff', 'everyone')) NOT NULL,
  target_class_ids uuid[] DEFAULT '{}',
  target_parent_ids uuid[] DEFAULT '{}',
  
  -- Priority & Urgency
  priority_level text CHECK (priority_level IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
  requires_acknowledgment boolean DEFAULT false,
  auto_followup_minutes integer DEFAULT 30,
  
  -- Communication Channels
  send_push_notification boolean DEFAULT true,
  send_sms boolean DEFAULT false,
  send_email boolean DEFAULT true,
  send_in_app boolean DEFAULT true,
  
  -- Status & Tracking
  is_active boolean DEFAULT true,
  sent_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  total_recipients integer DEFAULT 0,
  acknowledged_count integer DEFAULT 0,
  
  -- Location & Context
  location_specific boolean DEFAULT false,
  affected_areas text[],
  emergency_contact_info text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency Alert Acknowledgments Table
CREATE TABLE IF NOT EXISTS public.emergency_alert_acknowledgments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_id uuid NOT NULL REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  response_message text,
  location_confirmed boolean DEFAULT false,
  
  UNIQUE(alert_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_media_uploads_preschool_id ON public.media_uploads(preschool_id);
CREATE INDEX IF NOT EXISTS idx_media_uploads_message_id ON public.media_uploads(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_uploads_activity_id ON public.media_uploads(classroom_activity_id) WHERE classroom_activity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_uploads_student_id ON public.media_uploads(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_uploads_created_at ON public.media_uploads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classroom_activities_preschool_id ON public.classroom_activities(preschool_id);
CREATE INDEX IF NOT EXISTS idx_classroom_activities_teacher_id ON public.classroom_activities(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classroom_activities_student_ids ON public.classroom_activities USING GIN(student_ids);
CREATE INDEX IF NOT EXISTS idx_classroom_activities_created_at ON public.classroom_activities(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_classroom_reports_student_date ON public.classroom_reports(student_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_reports_preschool_date ON public.classroom_reports(preschool_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_classroom_reports_teacher_id ON public.classroom_reports(teacher_id);

CREATE INDEX IF NOT EXISTS idx_video_calls_preschool_scheduled ON public.video_call_sessions(preschool_id, scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_video_calls_host_id ON public.video_call_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_video_calls_participants ON public.video_call_sessions USING GIN(invited_participants);

CREATE INDEX IF NOT EXISTS idx_emergency_alerts_preschool_active ON public.emergency_alerts(preschool_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_expires_at ON public.emergency_alerts(expires_at) WHERE expires_at IS NOT NULL;

-- Row Level Security (RLS) Policies

-- Media Uploads RLS
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view media from their preschool" ON public.media_uploads
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload media to their preschool" ON public.media_uploads
  FOR INSERT WITH CHECK (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    ) AND
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own media" ON public.media_uploads
  FOR UPDATE USING (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own media" ON public.media_uploads
  FOR DELETE USING (
    uploaded_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Classroom Activities RLS
ALTER TABLE public.classroom_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities from their preschool" ON public.classroom_activities
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create activities" ON public.classroom_activities
  FOR INSERT WITH CHECK (
    teacher_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('teacher', 'preschool_admin')
    )
  );

CREATE POLICY "Teachers can update their activities" ON public.classroom_activities
  FOR UPDATE USING (
    teacher_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Classroom Reports RLS
ALTER TABLE public.classroom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their child's reports" ON public.classroom_reports
  FOR SELECT USING (
    student_id IN (
      SELECT s.id FROM public.students s
      JOIN public.users u ON s.parent_id = u.id
      WHERE u.auth_user_id = auth.uid()
    ) OR
    teacher_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create and update reports" ON public.classroom_reports
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('teacher', 'preschool_admin')
    )
  );

-- Video Call Sessions RLS
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calls they're invited to" ON public.video_call_sessions
  FOR SELECT USING (
    host_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    ) OR
    (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    ) = ANY(invited_participants)
  );

CREATE POLICY "Users can create video calls" ON public.video_call_sessions
  FOR INSERT WITH CHECK (
    host_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update their calls" ON public.video_call_sessions
  FOR UPDATE USING (
    host_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Emergency Alerts RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view alerts for their preschool" ON public.emergency_alerts
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and teachers can create alerts" ON public.emergency_alerts
  FOR INSERT WITH CHECK (
    sender_id IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('teacher', 'preschool_admin', 'superadmin')
    )
  );

-- Emergency Alert Acknowledgments RLS
ALTER TABLE public.emergency_alert_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own acknowledgments" ON public.emergency_alert_acknowledgments
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can acknowledge alerts" ON public.emergency_alert_acknowledgments
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_media_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_classroom_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_classroom_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_video_call_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_emergency_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_media_uploads_updated_at
  BEFORE UPDATE ON public.media_uploads
  FOR EACH ROW EXECUTE FUNCTION update_media_uploads_updated_at();

CREATE TRIGGER trigger_update_classroom_activities_updated_at
  BEFORE UPDATE ON public.classroom_activities
  FOR EACH ROW EXECUTE FUNCTION update_classroom_activities_updated_at();

CREATE TRIGGER trigger_update_classroom_reports_updated_at
  BEFORE UPDATE ON public.classroom_reports
  FOR EACH ROW EXECUTE FUNCTION update_classroom_reports_updated_at();

CREATE TRIGGER trigger_update_video_call_sessions_updated_at
  BEFORE UPDATE ON public.video_call_sessions
  FOR EACH ROW EXECUTE FUNCTION update_video_call_sessions_updated_at();

CREATE TRIGGER trigger_update_emergency_alerts_updated_at
  BEFORE UPDATE ON public.emergency_alerts
  FOR EACH ROW EXECUTE FUNCTION update_emergency_alerts_updated_at();

-- Create storage bucket for media uploads (run this manually in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media-uploads', 'media-uploads', true);

-- Storage policies for media-uploads bucket
-- CREATE POLICY "Authenticated users can upload media" ON storage.objects
--   FOR INSERT WITH CHECK (
--     bucket_id = 'media-uploads' AND
--     auth.role() = 'authenticated'
--   );

-- CREATE POLICY "Authenticated users can view media" ON storage.objects
--   FOR SELECT USING (
--     bucket_id = 'media-uploads' AND
--     auth.role() = 'authenticated'
--   );

-- CREATE POLICY "Users can delete their own media" ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'media-uploads' AND
--     auth.uid()::text = (storage.foldername(name))[1]
--   );
