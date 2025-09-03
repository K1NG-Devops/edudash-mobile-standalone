-- Create Event Tables Properly
-- This migration ensures the enhanced events system tables are created correctly

BEGIN;

-- First, add missing columns to events table if they don't exist
DO $$
BEGIN
    -- Add event_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'event_type') THEN
        ALTER TABLE public.events ADD COLUMN event_type VARCHAR(50) DEFAULT 'general';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'status') THEN
        ALTER TABLE public.events ADD COLUMN status VARCHAR(20) DEFAULT 'upcoming';
    END IF;
    
    -- Add max_participants column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'max_participants') THEN
        ALTER TABLE public.events ADD COLUMN max_participants INTEGER;
    END IF;
    
    -- Add cover_image_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'cover_image_url') THEN
        ALTER TABLE public.events ADD COLUMN cover_image_url TEXT;
    END IF;
    
    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'is_featured') THEN
        ALTER TABLE public.events ADD COLUMN is_featured BOOLEAN DEFAULT false;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'tags') THEN
        ALTER TABLE public.events ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'metadata') THEN
        ALTER TABLE public.events ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END$$;

-- Create event_updates table
CREATE TABLE IF NOT EXISTS public.event_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    content TEXT NOT NULL,
    update_type VARCHAR(50) DEFAULT 'general',
    is_live BOOLEAN DEFAULT false,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visibility VARCHAR(20) DEFAULT 'public',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create event_media table
CREATE TABLE IF NOT EXISTS public.event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.event_updates(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL,
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

-- Create event_participants table
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    participation_type VARCHAR(50) DEFAULT 'attendee',
    status VARCHAR(20) DEFAULT 'registered',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checked_in_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, user_id, student_id)
);

-- Create event_reactions table
CREATE TABLE IF NOT EXISTS public.event_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.event_updates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    content TEXT,
    parent_reaction_id UUID REFERENCES public.event_reactions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create event_notifications table
CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.event_updates(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_events_preschool_status ON public.events(preschool_id, status);

CREATE INDEX IF NOT EXISTS idx_event_updates_event ON public.event_updates(event_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_author ON public.event_updates(author_id);
CREATE INDEX IF NOT EXISTS idx_event_updates_posted ON public.event_updates(posted_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_media_event ON public.event_media(event_id);
CREATE INDEX IF NOT EXISTS idx_event_media_update ON public.event_media(update_id);

CREATE INDEX IF NOT EXISTS idx_event_participants_event ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON public.event_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_event_reactions_event ON public.event_reactions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reactions_update ON public.event_reactions(update_id);

CREATE INDEX IF NOT EXISTS idx_event_notifications_recipient ON public.event_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_event ON public.event_notifications(event_id);

-- Enable RLS
ALTER TABLE public.event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for event_updates
DROP POLICY IF EXISTS "Users can view event updates in their preschool" ON public.event_updates;
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

DROP POLICY IF EXISTS "Teachers can create event updates" ON public.event_updates;
CREATE POLICY "Teachers can create event updates" ON public.event_updates
    FOR INSERT WITH CHECK (
        author_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('teacher', 'preschool_admin')
        )
    );

-- Basic RLS policies for other tables
DROP POLICY IF EXISTS "Users can view event media" ON public.event_media;
CREATE POLICY "Users can view event media" ON public.event_media
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;
CREATE POLICY "Users can view event participants" ON public.event_participants
    FOR SELECT USING (
        event_id IN (
            SELECT id FROM public.events 
            WHERE preschool_id IN (
                SELECT preschool_id FROM public.users 
                WHERE auth_user_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Users can manage their own participation" ON public.event_participants;
CREATE POLICY "Users can manage their own participation" ON public.event_participants
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view event reactions" ON public.event_reactions;
CREATE POLICY "Users can view event reactions" ON public.event_reactions
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

DROP POLICY IF EXISTS "Users can manage their own reactions" ON public.event_reactions;
CREATE POLICY "Users can manage their own reactions" ON public.event_reactions
    FOR ALL USING (
        user_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.event_notifications;
CREATE POLICY "Users can view their own notifications" ON public.event_notifications
    FOR SELECT USING (
        recipient_id IN (
            SELECT id FROM public.users 
            WHERE auth_user_id = auth.uid()
        )
    );

COMMIT;
