-- Event Targeting and Principal Groups System
-- This migration adds comprehensive event targeting and group management for principals

BEGIN;

-- Add audience targeting fields to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS audience_type VARCHAR(50) DEFAULT 'everyone';
-- Possible values: 'everyone', 'principals', 'teachers', 'parents', 'specific_groups', 'specific_users'

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS audience_config JSONB DEFAULT '{}';
-- Stores specific audience configuration like group IDs, user IDs, role filters, etc.

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
-- Whether joining this event requires approval from the creator

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS auto_accept_roles TEXT[] DEFAULT '{}';
-- Roles that are auto-accepted without approval

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'public';
-- 'public', 'private', 'restricted' - controls who can see the event

-- Principal Groups table - for principals to create and manage groups
CREATE TABLE IF NOT EXISTS public.principal_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    preschool_id UUID NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
    group_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'department', 'grade_level', 'committee'
    color VARCHAR(7) DEFAULT '#6366F1', -- Hex color for UI
    icon VARCHAR(50) DEFAULT 'people', -- Icon identifier
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}', -- Group-specific settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique group names per preschool
    UNIQUE(preschool_id, name)
);

-- Group Members table - manages membership in principal groups
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.principal_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_in_group VARCHAR(50) DEFAULT 'member', -- 'admin', 'moderator', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'pending', 'inactive'
    permissions JSONB DEFAULT '{}', -- Specific permissions within the group
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique membership per group
    UNIQUE(group_id, user_id)
);

-- Event Audience table - specifically defines who can see/join events
CREATE TABLE IF NOT EXISTS public.event_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    audience_type VARCHAR(50) NOT NULL, -- 'role', 'group', 'user', 'preschool'
    target_id UUID, -- group_id, user_id, or preschool_id depending on type
    target_value VARCHAR(255), -- role name if audience_type is 'role'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Invitations table - for managing event invitations and RSVPs
CREATE TABLE IF NOT EXISTS public.event_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'maybe'
    response_message TEXT,
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    reminder_count INTEGER DEFAULT 0,
    last_reminder_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(event_id, invitee_id)
);

-- Group Invitations table - for inviting users to join groups
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.principal_groups(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    UNIQUE(group_id, invitee_id)
);

-- Activity Feed table - for tracking group and event activities
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'created_event', 'joined_group', 'shared_update', etc.
    target_type VARCHAR(50) NOT NULL, -- 'event', 'group', 'user', 'post'
    target_id UUID NOT NULL, -- ID of the target object
    preschool_id UUID NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}', -- Additional context about the activity
    visibility VARCHAR(50) DEFAULT 'public', -- 'public', 'group', 'private'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_audience_type ON public.events(audience_type);
CREATE INDEX IF NOT EXISTS idx_events_visibility ON public.events(visibility);
CREATE INDEX IF NOT EXISTS idx_events_requires_approval ON public.events(requires_approval);

CREATE INDEX IF NOT EXISTS idx_principal_groups_preschool ON public.principal_groups(preschool_id);
CREATE INDEX IF NOT EXISTS idx_principal_groups_created_by ON public.principal_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_principal_groups_type ON public.principal_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_principal_groups_active ON public.principal_groups(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);

CREATE INDEX IF NOT EXISTS idx_event_audiences_event ON public.event_audiences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audiences_type ON public.event_audiences(audience_type, target_id);

CREATE INDEX IF NOT EXISTS idx_event_invitations_event ON public.event_invitations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_invitee ON public.event_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_status ON public.event_invitations(status);

CREATE INDEX IF NOT EXISTS idx_group_invitations_group ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invitee ON public.group_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

CREATE INDEX IF NOT EXISTS idx_activity_feed_preschool ON public.activity_feed(preschool_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON public.activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON public.activity_feed(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON public.activity_feed(created_at DESC);

-- Enable RLS on all new tables
ALTER TABLE public.principal_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Principal Groups
CREATE POLICY "Users can view groups in their preschool" ON public.principal_groups
    FOR SELECT USING (
        preschool_id IN (
            SELECT preschool_id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create groups in their preschool" ON public.principal_groups
    FOR INSERT WITH CHECK (
        created_by IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
            AND role IN ('preschool_admin', 'teacher')
        ) AND
        preschool_id IN (
            SELECT preschool_id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Group creators can manage their groups" ON public.principal_groups
    FOR ALL USING (
        created_by IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- RLS Policies for Group Members
CREATE POLICY "Users can view group members in their preschool" ON public.group_members
    FOR SELECT USING (
        group_id IN (
            SELECT id FROM public.principal_groups 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their own group memberships" ON public.group_members
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can manage group members" ON public.group_members
    FOR ALL USING (
        group_id IN (
            SELECT g.id FROM public.principal_groups g
            WHERE g.created_by IN (
                SELECT id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        ) OR
        group_id IN (
            SELECT gm.group_id FROM public.group_members gm
            WHERE gm.user_id IN (
                SELECT id FROM public.users 
                WHERE auth_user_id = auth.uid()
            ) AND gm.role_in_group IN ('admin', 'moderator')
        )
    );

-- RLS Policies for Event Audiences
CREATE POLICY "Users can view event audiences in their preschool" ON public.event_audiences
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Event creators can manage event audiences" ON public.event_audiences
    FOR ALL USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE created_by IN (
                SELECT id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- RLS Policies for Event Invitations
CREATE POLICY "Users can view their own event invitations" ON public.event_invitations
    FOR SELECT USING (
        invitee_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        inviter_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own event invitations" ON public.event_invitations
    FOR UPDATE USING (
        invitee_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create event invitations for their events" ON public.event_invitations
    FOR INSERT WITH CHECK (
        inviter_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) AND
        event_id IN (
            SELECT id FROM public.events 
            WHERE created_by IN (
                SELECT id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- RLS Policies for Group Invitations
CREATE POLICY "Users can view their group invitations" ON public.group_invitations
    FOR SELECT USING (
        invitee_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) OR
        inviter_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can respond to their group invitations" ON public.group_invitations
    FOR UPDATE USING (
        invitee_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Group admins can create invitations" ON public.group_invitations
    FOR INSERT WITH CHECK (
        inviter_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) AND
        group_id IN (
            SELECT g.id FROM public.principal_groups g
            WHERE g.created_by IN (
                SELECT id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

-- RLS Policies for Activity Feed
CREATE POLICY "Users can view activity in their preschool" ON public.activity_feed
    FOR SELECT USING (
        preschool_id IN (
            SELECT preschool_id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own activities" ON public.activity_feed
    FOR INSERT WITH CHECK (
        actor_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        ) AND
        preschool_id IN (
            SELECT preschool_id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Helper functions for event visibility and access
CREATE OR REPLACE FUNCTION can_user_see_event(p_event_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_event RECORD;
    v_user RECORD;
    v_can_see BOOLEAN := false;
BEGIN
    -- Get event details
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Get user details
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check if user is in the same preschool
    IF v_user.preschool_id != v_event.preschool_id THEN
        RETURN false;
    END IF;
    
    -- Check visibility
    IF v_event.visibility = 'public' THEN
        RETURN true;
    END IF;
    
    -- Check audience type
    CASE v_event.audience_type
        WHEN 'everyone' THEN
            v_can_see := true;
        WHEN 'principals' THEN
            v_can_see := v_user.role = 'preschool_admin';
        WHEN 'teachers' THEN
            v_can_see := v_user.role = 'teacher';
        WHEN 'parents' THEN
            v_can_see := v_user.role = 'parent';
        WHEN 'specific_groups' THEN
            -- Check if user is in any of the specified groups
            v_can_see := EXISTS (
                SELECT 1 FROM public.event_audiences ea
                JOIN public.group_members gm ON ea.target_id = gm.group_id
                WHERE ea.event_id = p_event_id 
                AND ea.audience_type = 'group'
                AND gm.user_id = p_user_id
                AND gm.status = 'active'
            );
        WHEN 'specific_users' THEN
            -- Check if user is specifically invited
            v_can_see := EXISTS (
                SELECT 1 FROM public.event_audiences ea
                WHERE ea.event_id = p_event_id 
                AND ea.audience_type = 'user'
                AND ea.target_id = p_user_id
            );
        ELSE
            v_can_see := false;
    END CASE;
    
    RETURN v_can_see;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible groups
CREATE OR REPLACE FUNCTION get_user_groups(p_user_id UUID)
RETURNS TABLE (
    group_id UUID,
    group_name VARCHAR(255),
    role_in_group VARCHAR(50),
    group_type VARCHAR(50),
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg.id,
        pg.name,
        gm.role_in_group,
        pg.group_type,
        (
            SELECT COUNT(*) 
            FROM public.group_members gm2 
            WHERE gm2.group_id = pg.id AND gm2.status = 'active'
        )
    FROM public.principal_groups pg
    JOIN public.group_members gm ON pg.id = gm.group_id
    WHERE gm.user_id = p_user_id 
    AND gm.status = 'active'
    AND pg.is_active = true
    ORDER BY pg.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION can_user_see_event(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_groups(UUID) TO authenticated;

COMMIT;
