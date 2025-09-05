-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Principal Groups Table
CREATE TABLE IF NOT EXISTS public.principal_groups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  group_type text CHECK (group_type IN ('custom', 'department', 'grade_level', 'committee')) NOT NULL,
  color text DEFAULT '#3B82F6',
  icon text DEFAULT 'person.3.fill',
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(preschool_id, name)
);
-- Group Members Table
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.principal_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_in_group text CHECK (role_in_group IN ('admin', 'moderator', 'member')) NOT NULL DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text CHECK (status IN ('active', 'pending', 'inactive')) NOT NULL DEFAULT 'active',
  permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(group_id, user_id)
);
-- Event Audiences Table
CREATE TABLE IF NOT EXISTS public.event_audiences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  audience_type text CHECK (audience_type IN ('role', 'group', 'user', 'preschool')) NOT NULL,
  target_id uuid,
  target_value text,
  created_at timestamptz DEFAULT now()
);
-- Create a unique index to enforce uniqueness across (event_id, type, coalesced target)
-- Note: Postgres does not allow expressions in a table-level UNIQUE constraint; use an index instead.
CREATE UNIQUE INDEX IF NOT EXISTS event_audiences_unique_idx
  ON public.event_audiences (event_id, audience_type, (COALESCE(target_id::text, target_value)));
-- Event Invitations Table
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'maybe')) NOT NULL DEFAULT 'pending',
  response_message text,
  invited_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamptz,
  
  UNIQUE(event_id, invitee_id)
);
-- Group Invitations Table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id uuid NOT NULL REFERENCES public.principal_groups(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message text,
  status text CHECK (status IN ('pending', 'accepted', 'declined')) NOT NULL DEFAULT 'pending',
  invited_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  
  UNIQUE(group_id, invitee_id)
);
-- Activity Feed Table
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text CHECK (target_type IN ('event', 'group', 'user', 'post')) NOT NULL,
  target_id uuid NOT NULL,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  visibility text CHECK (visibility IN ('public', 'group', 'private')) NOT NULL DEFAULT 'public',
  created_at timestamptz DEFAULT now()
);
-- Notification History Table
CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  recipient_ids text[],
  sent_at timestamptz DEFAULT now(),
  delivery_status text DEFAULT 'sent',
  error_message text,
  created_at timestamptz DEFAULT now()
);
-- Add columns to existing events table for enhanced functionality
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_participants integer,
ADD COLUMN IF NOT EXISTS current_participants integer DEFAULT 0;
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_principal_groups_preschool_id ON public.principal_groups(preschool_id);
CREATE INDEX IF NOT EXISTS idx_principal_groups_created_by ON public.principal_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_principal_groups_type ON public.principal_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);
CREATE INDEX IF NOT EXISTS idx_event_audiences_event_id ON public.event_audiences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audiences_target_id ON public.event_audiences(target_id) WHERE target_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_audiences_target_value ON public.event_audiences(target_value) WHERE target_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee_id ON public.event_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_status ON public.event_invitations(status);
CREATE INDEX IF NOT EXISTS idx_activity_feed_preschool_id ON public.activity_feed(preschool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id ON public.activity_feed(actor_id);
-- Enable Row Level Security
ALTER TABLE public.principal_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
-- RLS Policies for Principal Groups
DROP POLICY IF EXISTS "Users can view groups in their preschool" ON public.principal_groups;
CREATE POLICY "Users can view groups in their preschool" ON public.principal_groups
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Principals can create groups" ON public.principal_groups;
CREATE POLICY "Principals can create groups" ON public.principal_groups
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('principal', 'preschool_admin')
    )
  );
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.principal_groups;
CREATE POLICY "Group creators can update their groups" ON public.principal_groups
  FOR UPDATE USING (
    created_by = auth.uid()
  );
DROP POLICY IF EXISTS "Group creators can delete their groups" ON public.principal_groups;
CREATE POLICY "Group creators can delete their groups" ON public.principal_groups
  FOR DELETE USING (
    created_by = auth.uid()
  );
-- RLS Policies for Group Members
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    group_id IN (
      SELECT id FROM public.principal_groups
      WHERE preschool_id IN (
        SELECT preschool_id FROM public.users WHERE id = auth.uid()
      )
    )
  );
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
CREATE POLICY "Group admins can manage members" ON public.group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role_in_group IN ('admin', 'moderator')
    )
  );
-- RLS Policies for Event Audiences
DROP POLICY IF EXISTS "Event creators can manage audiences" ON public.event_audiences;
CREATE POLICY "Event creators can manage audiences" ON public.event_audiences
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE created_by = auth.uid()
    )
  );
DROP POLICY IF EXISTS "Users can view event audiences" ON public.event_audiences;
CREATE POLICY "Users can view event audiences" ON public.event_audiences
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE preschool_id IN (
        SELECT preschool_id FROM public.users WHERE id = auth.uid()
      )
    )
  );
-- RLS Policies for Event Invitations
DROP POLICY IF EXISTS "Users can view their invitations" ON public.event_invitations;
CREATE POLICY "Users can view their invitations" ON public.event_invitations
  FOR SELECT USING (
    invitee_id = auth.uid() OR inviter_id = auth.uid()
  );
DROP POLICY IF EXISTS "Users can create invitations" ON public.event_invitations;
CREATE POLICY "Users can create invitations" ON public.event_invitations
  FOR INSERT WITH CHECK (
    inviter_id = auth.uid()
  );
DROP POLICY IF EXISTS "Users can respond to their invitations" ON public.event_invitations;
CREATE POLICY "Users can respond to their invitations" ON public.event_invitations
  FOR UPDATE USING (
    invitee_id = auth.uid()
  );
DROP POLICY IF EXISTS "Inviters can cancel invitations" ON public.event_invitations;
CREATE POLICY "Inviters can cancel invitations" ON public.event_invitations
  FOR DELETE USING (
    inviter_id = auth.uid()
  );
-- RLS Policies for Group Invitations
DROP POLICY IF EXISTS "Users can view their group invitations" ON public.group_invitations;
CREATE POLICY "Users can view their group invitations" ON public.group_invitations
  FOR SELECT USING (
    invitee_id = auth.uid() OR inviter_id = auth.uid()
  );
DROP POLICY IF EXISTS "Group admins can invite users" ON public.group_invitations;
CREATE POLICY "Group admins can invite users" ON public.group_invitations
  FOR INSERT WITH CHECK (
    inviter_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invitations.group_id
      AND user_id = auth.uid()
      AND role_in_group IN ('admin', 'moderator')
    )
  );
DROP POLICY IF EXISTS "Users can respond to group invitations" ON public.group_invitations;
CREATE POLICY "Users can respond to group invitations" ON public.group_invitations
  FOR UPDATE USING (
    invitee_id = auth.uid()
  );
-- RLS Policies for Activity Feed
DROP POLICY IF EXISTS "Users can view activity in their preschool" ON public.activity_feed;
CREATE POLICY "Users can view activity in their preschool" ON public.activity_feed
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE id = auth.uid()
    )
    AND (
      visibility = 'public' OR
      (visibility = 'group' AND target_id IN (
        SELECT group_id FROM public.group_members WHERE user_id = auth.uid()
      )) OR
      (visibility = 'private' AND actor_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "Users can create activity" ON public.activity_feed;
CREATE POLICY "Users can create activity" ON public.activity_feed
  FOR INSERT WITH CHECK (
    actor_id = auth.uid()
  );
-- RLS Policies for Notification History
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notification_history;
CREATE POLICY "Users can view their notifications" ON public.notification_history
  FOR SELECT USING (
    auth.uid()::text = ANY(recipient_ids)
  );
-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_principal_groups_updated_at BEFORE UPDATE ON public.principal_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Create function to log activity
CREATE OR REPLACE FUNCTION log_activity(
  p_actor_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_preschool_id uuid,
  p_metadata jsonb DEFAULT '{}',
  p_visibility text DEFAULT 'public'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.activity_feed (
    actor_id,
    action,
    target_type,
    target_id,
    preschool_id,
    metadata,
    visibility
  ) VALUES (
    p_actor_id,
    p_action,
    p_target_type,
    p_target_id,
    p_preschool_id,
    p_metadata,
    p_visibility
  );
END;
$$ LANGUAGE plpgsql;
-- Create function to update event participant count
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'accepted' THEN
    UPDATE public.events 
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    UPDATE public.events 
    SET current_participants = current_participants + 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    UPDATE public.events 
    SET current_participants = current_participants - 1
    WHERE id = NEW.event_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'accepted' THEN
    UPDATE public.events 
    SET current_participants = current_participants - 1
    WHERE id = OLD.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_event_participants
  AFTER INSERT OR UPDATE OR DELETE ON public.event_invitations
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();
