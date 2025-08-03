-- Messaging System Tables

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

-- Table: MessageRecipients
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

-- Table: MessageDrafts
CREATE TABLE IF NOT EXISTS public.message_drafts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL,
  preschool_id uuid NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  message_type text CHECK (message_type IN ('direct', 'announcement', 'system', 'homework_discussion')) NOT NULL,
  recipient_data jsonb,
  attachment_urls text[],
  scheduled_send_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: MessageNotifications
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
