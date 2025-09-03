-- Enhanced Events System Migration
-- This migration adds comprehensive event management with updates, media, engagement, and real-time features

BEGIN;

-- Enhance existing events table with additional fields
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'general';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'upcoming';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_participants INTEGER;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for enhanced events table
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_preschool_status ON public.events(preschool_id, status);

-- Event Updates/Posts table - for posting what happened during events
CREATE TABLE IF NOT EXISTS public.event_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    update_type VARCHAR(50) DEFAULT 'general', -- general, milestone, announcement, completion
    is_live BOOLEAN DEFAULT false,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visibility VARCHAR(20) DEFAULT 'public', -- public, parents_only, staff_only
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for event_updates
CREATE INDEX IF NOT EXISTS idx_event_updates_event ON public.event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_author ON public.event_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_posted ON public.event_updates(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_updates_live ON public.event_updates(is_live) WHERE is_live = true;
CREATE INDEX IF NOT EXISTS idx_event_updates_visibility ON public.event_updates(visibility);

-- Event Media table - for photos, videos, and other media
CREATE TABLE IF NOT EXISTS public.event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.event_updates(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- image, video, document
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    alt_text TEXT,
    caption TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for event_media
CREATE INDEX IF NOT EXISTS idx_event_media_event ON public.event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_update ON public.event_media(update_id);
CREATE INDEX IF NOT EXISTS idx_event_media_uploader ON public.event_media(uploader_id);
CREATE INDEX IF NOT EXISTS idx_event_media_type ON public.event_media(media_type);
CREATE INDEX IF NOT EXISTS idx_event_media_created ON public.event_media(created_at DESC);

-- Event Participants table - for tracking attendance and participation
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    participation_type VARCHAR(50) DEFAULT 'attendee', -- attendee, volunteer, organizer, performer
    status VARCHAR(20) DEFAULT 'registered', -- registered, attended, absent, cancelled
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id, student_id)
);

-- Indexes for event_participants
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_student ON public.event_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON public.event_participants(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_type ON public.event_participants(participation_type);

-- Event Reactions table - for likes, comments, and other engagement
CREATE TABLE IF NOT EXISTS public.event_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.event_updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL, -- like, love, laugh, wow, sad, angry, comment
    content TEXT, -- for comments
    parent_reaction_id UUID REFERENCES public.event_reactions(id) ON DELETE CASCADE, -- for comment replies
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure one reaction type per user per target (either event or update)
    UNIQUE(event_id, update_id, user_id, reaction_type) DEFERRABLE INITIALLY DEFERRED
);

-- Indexes for event_reactions
CREATE INDEX IF NOT EXISTS idx_event_reactions_event ON public.event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_update ON public.event_reactions(update_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_user ON public.event_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_type ON public.event_reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_event_reactions_parent ON public.event_reactions(parent_reaction_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_created ON public.event_reactions(created_at DESC);

-- Event Notifications table - for tracking event-related notifications
CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.event_updates(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- event_created, event_updated, live_update, event_starting, event_ended, new_media
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for event_notifications
CREATE INDEX IF NOT EXISTS idx_event_notifications_recipient ON public.event_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_event ON public.event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_unread ON public.event_notifications(recipient_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_event_notifications_type ON public.event_notifications(notification_type);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS set_timestamp_events ON public.events;
CREATE TRIGGER set_timestamp_events
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_event_updates ON public.event_updates;
CREATE TRIGGER set_timestamp_event_updates
    BEFORE UPDATE ON public.event_updates
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_event_participants ON public.event_participants;
CREATE TRIGGER set_timestamp_event_participants
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_event_reactions ON public.event_reactions;
CREATE TRIGGER set_timestamp_event_reactions
    BEFORE UPDATE ON public.event_reactions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies for enhanced events system
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

-- Events policies (enhanced)
DROP POLICY IF EXISTS "Users can view events in their preschool" ON public.events;
CREATE POLICY "Users can view events in their preschool" ON public.events
    FOR SELECT USING (
        preschool_id IN (
            SELECT preschool_id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Teachers and admins can manage events" ON public.events;
CREATE POLICY "Teachers and admins can manage events" ON public.events
    FOR ALL USING (
        preschool_id IN (
            SELECT preschool_id FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('teacher', 'preschool_admin')
        )
    );

-- Event Updates policies
CREATE POLICY "Users can view event updates in their preschool" ON public.event_updates
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Teachers and admins can create event updates" ON public.event_updates
    FOR INSERT WITH CHECK (
        author_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('teacher', 'preschool_admin')
        )
    );

CREATE POLICY "Authors can update their own event updates" ON public.event_updates
    FOR UPDATE USING (
        author_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Event Media policies
CREATE POLICY "Users can view event media in their preschool" ON public.event_media
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Teachers and admins can upload event media" ON public.event_media
    FOR INSERT WITH CHECK (
        uploader_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('teacher', 'preschool_admin')
        )
    );

-- Event Participants policies
CREATE POLICY "Users can view participants for events in their preschool" ON public.event_participants
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage their own participation" ON public.event_participants
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Event Reactions policies
CREATE POLICY "Users can view reactions for events in their preschool" ON public.event_reactions
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        ) OR update_id IN (
            SELECT id FROM public.event_updates 
            WHERE event_id IN (
                SELECT id FROM public.events 
                WHERE preschool_id IN (
                    SELECT preschool_id FROM public.users 
                    WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can manage their own reactions" ON public.event_reactions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Event Notifications policies
CREATE POLICY "Users can view their own event notifications" ON public.event_notifications
    FOR SELECT USING (
        recipient_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own event notifications" ON public.event_notifications
    FOR UPDATE USING (
        recipient_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

-- Utility functions for events system
CREATE OR REPLACE FUNCTION get_event_stats(p_event_id UUID)
RETURNS TABLE (
    participants_count INTEGER,
    updates_count INTEGER,
    media_count INTEGER,
    reactions_count INTEGER,
    comments_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM public.event_participants WHERE event_id = p_event_id AND status = 'attended'),
        (SELECT COUNT(*)::INTEGER FROM public.event_updates WHERE event_id = p_event_id AND deleted_at IS NULL),
        (SELECT COUNT(*)::INTEGER FROM public.event_media WHERE event_id = p_event_id AND deleted_at IS NULL),
        (SELECT COUNT(*)::INTEGER FROM public.event_reactions WHERE event_id = p_event_id AND reaction_type != 'comment' AND deleted_at IS NULL),
        (SELECT COUNT(*)::INTEGER FROM public.event_reactions WHERE event_id = p_event_id AND reaction_type = 'comment' AND deleted_at IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create event notification
-- Reordered parameters to place defaults at the end (PostgreSQL requires this)
CREATE OR REPLACE FUNCTION create_event_notification(
    p_event_id UUID,
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_update_id UUID DEFAULT NULL,
    p_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    r RECORD;
BEGIN
    -- Send notifications to all users in the same preschool as the event
    FOR r IN 
        SELECT u.id as user_id
        FROM public.users u
        INNER JOIN public.events e ON e.preschool_id = u.preschool_id
        WHERE e.id = p_event_id
    LOOP
        INSERT INTO public.event_notifications (
            event_id, update_id, recipient_id, notification_type, title, message
        ) VALUES (
            p_event_id, p_update_id, r.user_id, p_notification_type, p_title, p_message
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_event_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_notification(UUID, VARCHAR(50), VARCHAR(255), UUID, TEXT) TO authenticated;

COMMIT;
