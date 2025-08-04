-- Migration to add missing tables for EduDashPro

-- Table: Classroom Reports
CREATE TABLE IF NOT EXISTS public.classroom_reports (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  report_type text CHECK (report_type IN ('daily', 'weekly', 'monthly')) NOT NULL DEFAULT 'daily',
  report_date date NOT NULL,
  activities_summary jsonb DEFAULT '{}',
  total_activities integer DEFAULT 0,
  behavior_notes text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  participation_level text CHECK (participation_level IN ('low', 'moderate', 'high', 'excellent')),
  social_interactions text,
  learning_highlights text,
  skills_developed text[],
  areas_for_improvement text,
  achievement_badges text[],
  meals_eaten text[],
  nap_time_start timestamptz,
  nap_time_end timestamptz,
  diaper_changes integer DEFAULT 0,
  bathroom_visits integer DEFAULT 0,
  health_observations text,
  incidents text,
  medications_given text[],
  temperature_checks jsonb DEFAULT '[]',
  parent_message text,
  follow_up_needed boolean DEFAULT false,
  next_steps text,
  media_highlights uuid[] DEFAULT '{}',
  photo_count integer DEFAULT 0,
  is_sent_to_parents boolean DEFAULT false,
  sent_at timestamptz,
  parent_viewed_at timestamptz,
  parent_acknowledgment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, report_date, report_type)
);

-- Table: Video Call Sessions
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  session_type text CHECK (session_type IN ('parent_teacher', 'parent_meeting', 'staff_meeting', 'group_call')) NOT NULL,
  invited_participants uuid[] NOT NULL DEFAULT '{}',
  joined_participants uuid[] NOT NULL DEFAULT '{}',
  scheduled_start_time timestamptz NOT NULL,
  scheduled_end_time timestamptz NOT NULL,
  actual_start_time timestamptz,
  actual_end_time timestamptz,
  meeting_room_id text,
  meeting_url text,
  dial_in_number text,
  access_code text,
  is_recorded boolean DEFAULT false,
  recording_url text,
  max_participants integer DEFAULT 10,
  require_waiting_room boolean DEFAULT true,
  allow_screen_sharing boolean DEFAULT true,
  status text CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'scheduled',
  cancellation_reason text,
  reminder_sent boolean DEFAULT false,
  reminder_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  message_type text CHECK (message_type IN ('direct', 'announcement', 'system', 'homework_discussion')) NOT NULL,
  priority text CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  attachment_urls text[],
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  parent_message_id uuid,
  homework_assignment_id uuid,
  student_id uuid,
  scheduled_send_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Message Recipients
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_type text CHECK (recipient_type IN ('user', 'class', 'school', 'role')) NOT NULL,
  recipient_id text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_archived boolean DEFAULT false,
  archived_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Message Notifications
CREATE TABLE IF NOT EXISTS public.message_notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('new_message', 'message_reply', 'announcement', 'urgent_message')) NOT NULL,
  is_read boolean DEFAULT false,
  is_pushed boolean DEFAULT false,
  pushed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Table: Media Uploads
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

-- Table: Emergency Alerts
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type text CHECK (alert_type IN ('emergency', 'urgent', 'weather', 'security', 'health', 'closure', 'pickup_change')) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  instructions text,
  target_audience text CHECK (target_audience IN ('all_parents', 'class_parents', 'specific_parents', 'staff', 'everyone')) NOT NULL,
  target_class_ids uuid[] DEFAULT '{}',
  target_parent_ids uuid[] DEFAULT '{}',
  priority_level text CHECK (priority_level IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
  requires_acknowledgment boolean DEFAULT false,
  auto_followup_minutes integer DEFAULT 30,
  send_push_notification boolean DEFAULT true,
  send_sms boolean DEFAULT false,
  send_email boolean DEFAULT true,
  send_in_app boolean DEFAULT true,
  is_active boolean DEFAULT true,
  sent_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  total_recipients integer DEFAULT 0,
  acknowledged_count integer DEFAULT 0,
  location_specific boolean DEFAULT false,
  affected_areas text[],
  emergency_contact_info text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Emergency Alert Acknowledgments
CREATE TABLE IF NOT EXISTS public.emergency_alert_acknowledgments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_id uuid NOT NULL REFERENCES public.emergency_alerts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  acknowledged_at timestamptz DEFAULT now(),
  response_message text,
  location_confirmed boolean DEFAULT false,
  UNIQUE(alert_id, user_id)
);

-- Create necessary indexes and RLS policies if needed...
