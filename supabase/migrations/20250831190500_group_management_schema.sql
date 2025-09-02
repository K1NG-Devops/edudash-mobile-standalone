-- Migration: Group Management and Event Targeting Schema
-- Date: 2025-08-31
-- Description: Creates tables and policies for principal groups, event targeting, and invitations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRINCIPAL GROUPS TABLE
-- =====================================================
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

-- =====================================================
-- GROUP MEMBERS TABLE
-- =====================================================
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

-- =====================================================
-- EVENT AUDIENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_audiences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  audience_type text CHECK (audience_type IN ('role', 'group', 'user', 'preschool')) NOT NULL,
  target_id uuid,
  target_value text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- EVENT INVITATIONS TABLE
-- =====================================================
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

-- =====================================================
-- GROUP INVITATIONS TABLE
-- =====================================================
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

-- =====================================================
-- ACTIVITY FEED TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN (
    'created_event', 'joined_group', 'shared_update', 'left_group',
    'invited_user', 'accepted_invitation', 'declined_invitation',
    'updated_group', 'created_group', 'deleted_group'
  )),
  target_type text CHECK (target_type IN ('event', 'group', 'user', 'post')) NOT NULL,
  target_id uuid NOT NULL,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  visibility text CHECK (visibility IN ('public', 'group', 'private')) NOT NULL DEFAULT 'public',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- NOTIFICATION HISTORY TABLE (for push notification tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  recipient_ids uuid[] DEFAULT '{}',
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Group indexes
CREATE INDEX IF NOT EXISTS idx_principal_groups_preschool_id ON public.principal_groups(preschool_id);
CREATE INDEX IF NOT EXISTS idx_principal_groups_created_by ON public.principal_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_principal_groups_type ON public.principal_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_principal_groups_active ON public.principal_groups(is_active) WHERE is_active = true;

-- Group members indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON public.group_members(role_in_group);

-- Event audiences indexes
CREATE INDEX IF NOT EXISTS idx_event_audiences_event_id ON public.event_audiences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audiences_target_id ON public.event_audiences(target_id) WHERE target_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_audiences_target_value ON public.event_audiences(target_value) WHERE target_value IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_audiences_type ON public.event_audiences(audience_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_audiences_unique_target ON public.event_audiences (event_id, audience_type, (COALESCE(target_id::text, target_value)));

-- Event invitations indexes
CREATE INDEX IF NOT EXISTS idx_event_invitations_event_id ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee_id ON public.event_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_status ON public.event_invitations(status);
CREATE INDEX IF NOT EXISTS idx_event_invitations_pending ON public.event_invitations(invitee_id, status) WHERE status = 'pending';

-- Group invitations indexes
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee_id ON public.group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_group_invitations_expires ON public.group_invitations(expires_at) WHERE status = 'pending';

-- Activity feed indexes
CREATE INDEX IF NOT EXISTS idx_activity_feed_preschool_id ON public.activity_feed(preschool_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor_id ON public.activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON public.activity_feed(target_type, target_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.principal_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PRINCIPAL GROUPS POLICIES
-- =====================================================

-- Ensure policies are idempotent by dropping any existing ones before creation
DROP POLICY IF EXISTS "Users can view groups in their preschool" ON public.principal_groups;
DROP POLICY IF EXISTS "Principals can create groups" ON public.principal_groups;
DROP POLICY IF EXISTS "Group creators can update their groups" ON public.principal_groups;
DROP POLICY IF EXISTS "Group admins can delete groups" ON public.principal_groups;

DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

DROP POLICY IF EXISTS "Event creators can manage audiences" ON public.event_audiences;
DROP POLICY IF EXISTS "Users can view event audiences" ON public.event_audiences;

DROP POLICY IF EXISTS "Users can view their invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Event organizers can send invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Users can respond to their invitations" ON public.event_invitations;
DROP POLICY IF EXISTS "Inviters can cancel invitations" ON public.event_invitations;

DROP POLICY IF EXISTS "Users can view their group invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Group admins can send invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Invitees can respond to invitations" ON public.group_invitations;
DROP POLICY IF EXISTS "Inviters can cancel invitations" ON public.group_invitations;

DROP POLICY IF EXISTS "Users can view preschool activity" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can create activity entries" ON public.activity_feed;

DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notification_history;

-- Users can view groups in their preschool
CREATE POLICY "Users can view groups in their preschool" ON public.principal_groups
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Principals and preschool admins can create groups
CREATE POLICY "Principals can create groups" ON public.principal_groups
  FOR INSERT WITH CHECK (
    created_by IN (
      SELECT id FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND role IN ('principal', 'preschool_admin', 'superadmin')
    )
    AND preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Group creators can update their groups
CREATE POLICY "Group creators can update their groups" ON public.principal_groups
  FOR UPDATE USING (
    created_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = principal_groups.id
      AND user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      AND role_in_group = 'admin'
    )
  );

-- Group creators and admins can delete (soft delete via is_active)
CREATE POLICY "Group admins can delete groups" ON public.principal_groups
  FOR DELETE USING (
    created_by IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = principal_groups.id
      AND user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      AND role_in_group = 'admin'
    )
  );

-- =====================================================
-- GROUP MEMBERS POLICIES
-- =====================================================

-- Users can view group members in their preschool
CREATE POLICY "Users can view group members" ON public.group_members
  FOR SELECT USING (
    group_id IN (
      SELECT id FROM public.principal_groups
      WHERE preschool_id IN (
        SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can join groups (insert themselves as members)
CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    AND group_id IN (
      SELECT id FROM public.principal_groups
      WHERE preschool_id IN (
        SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
      )
      AND is_active = true
    )
  );

-- Group admins and moderators can manage members
CREATE POLICY "Group admins can manage members" ON public.group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
      AND gm.role_in_group IN ('admin', 'moderator')
      AND gm.status = 'active'
    )
  );

-- Users can leave groups (delete their membership)
CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (
    user_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
      AND gm.role_in_group = 'admin'
      AND gm.status = 'active'
    )
  );

-- =====================================================
-- EVENT AUDIENCES POLICIES
-- =====================================================

-- Event creators can manage audiences
CREATE POLICY "Event creators can manage audiences" ON public.event_audiences
  FOR ALL USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE created_by IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can view event audiences for events they can access
CREATE POLICY "Users can view event audiences" ON public.event_audiences
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE preschool_id IN (
        SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- EVENT INVITATIONS POLICIES
-- =====================================================

-- Users can view their invitations (sent or received)
CREATE POLICY "Users can view their invitations" ON public.event_invitations
  FOR SELECT USING (
    invitee_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    ) OR
    inviter_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Event organizers can send invitations
CREATE POLICY "Event organizers can send invitations" ON public.event_invitations
  FOR INSERT WITH CHECK (
    inviter_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    AND event_id IN (
      SELECT id FROM public.events
      WHERE created_by IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Users can respond to their invitations
CREATE POLICY "Users can respond to their invitations" ON public.event_invitations
  FOR UPDATE USING (
    invitee_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Inviters can cancel invitations
CREATE POLICY "Inviters can cancel invitations" ON public.event_invitations
  FOR DELETE USING (
    inviter_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- GROUP INVITATIONS POLICIES
-- =====================================================

-- Users can view their group invitations
CREATE POLICY "Users can view their group invitations" ON public.group_invitations
  FOR SELECT USING (
    invitee_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    ) OR
    inviter_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Group admins can send invitations
CREATE POLICY "Group admins can send invitations" ON public.group_invitations
  FOR INSERT WITH CHECK (
    inviter_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = group_invitations.group_id
      AND user_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      )
      AND role_in_group IN ('admin', 'moderator')
      AND status = 'active'
    )
  );

-- Invitees can respond to invitations
CREATE POLICY "Invitees can respond to invitations" ON public.group_invitations
  FOR UPDATE USING (
    invitee_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- Inviters can cancel invitations
CREATE POLICY "Inviters can cancel invitations" ON public.group_invitations
  FOR DELETE USING (
    inviter_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- ACTIVITY FEED POLICIES
-- =====================================================

-- Users can view activity in their preschool
CREATE POLICY "Users can view preschool activity" ON public.activity_feed
  FOR SELECT USING (
    preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
    AND (
      visibility = 'public'
      OR (visibility = 'group' AND target_type = 'group' AND target_id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id IN (
          SELECT id FROM public.users WHERE auth_user_id = auth.uid()
        )
        AND status = 'active'
      ))
      OR (visibility = 'private' AND actor_id IN (
        SELECT id FROM public.users WHERE auth_user_id = auth.uid()
      ))
    )
  );

-- Users can create activity entries for their actions
CREATE POLICY "Users can create activity entries" ON public.activity_feed
  FOR INSERT WITH CHECK (
    actor_id IN (
      SELECT id FROM public.users WHERE auth_user_id = auth.uid()
    )
    AND preschool_id IN (
      SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- NOTIFICATION HISTORY POLICIES
-- =====================================================

-- Only system/service accounts can write notification history
-- This would typically be done through a service role or edge function
CREATE POLICY "Service role can manage notifications" ON public.notification_history
  FOR ALL USING (false)
  WITH CHECK (false);

-- =====================================================
-- FUNCTIONS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_principal_groups_updated_at ON public.principal_groups;
CREATE TRIGGER update_principal_groups_updated_at BEFORE UPDATE ON public.principal_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_members_updated_at ON public.group_members;
CREATE TRIGGER update_group_members_updated_at BEFORE UPDATE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's role in a group
CREATE OR REPLACE FUNCTION get_user_group_role(p_user_id uuid, p_group_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role_in_group
    FROM public.group_members
    WHERE user_id = p_user_id
    AND group_id = p_group_id
    AND status = 'active'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access event based on audience settings
CREATE OR REPLACE FUNCTION can_user_access_event(p_user_id uuid, p_event_id uuid)
RETURNS boolean AS $$
DECLARE
  v_user_role text;
  v_preschool_id uuid;
  v_can_access boolean := false;
BEGIN
  -- Get user's role and preschool
  SELECT role, preschool_id INTO v_user_role, v_preschool_id
  FROM public.users
  WHERE id = p_user_id;

  -- Check if event is in user's preschool
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = p_event_id
    AND preschool_id = v_preschool_id
  ) THEN
    RETURN false;
  END IF;

  -- Check event audiences
  SELECT true INTO v_can_access
  FROM public.event_audiences
  WHERE event_id = p_event_id
  AND (
    -- Check role-based access
    (audience_type = 'role' AND target_value = v_user_role)
    -- Check user-specific access
    OR (audience_type = 'user' AND target_id = p_user_id)
    -- Check group-based access
    OR (audience_type = 'group' AND target_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = p_user_id
      AND status = 'active'
    ))
    -- Check preschool-wide access
    OR (audience_type = 'preschool' AND target_id = v_preschool_id)
  )
  LIMIT 1;

  -- If no specific audiences defined, check if it's a public event
  IF v_can_access IS NULL THEN
    SELECT true INTO v_can_access
    FROM public.events
    WHERE id = p_event_id
    AND (
      metadata->>'visibility' = 'public'
      OR NOT EXISTS (
        SELECT 1 FROM public.event_audiences
        WHERE event_id = p_event_id
      )
    );
  END IF;

  RETURN COALESCE(v_can_access, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.principal_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_audiences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_invitations TO authenticated;
GRANT SELECT, INSERT ON public.activity_feed TO authenticated;
GRANT SELECT ON public.notification_history TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Group Management and Event Targeting schema created successfully!' as status;

