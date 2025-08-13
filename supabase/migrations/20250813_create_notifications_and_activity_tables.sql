-- Add columns to existing notifications table if they don't exist
DO $$ 
BEGIN
    -- Check if the table exists, if not create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'activity')),
            read BOOLEAN DEFAULT false,
            action_url TEXT,
            related_entity_type VARCHAR(50),
            related_entity_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
            ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'action_url') THEN
            ALTER TABLE notifications ADD COLUMN action_url TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_entity_type') THEN
            ALTER TABLE notifications ADD COLUMN related_entity_type VARCHAR(50);
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'related_entity_id') THEN
            ALTER TABLE notifications ADD COLUMN related_entity_id UUID;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'updated_at') THEN
            ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Create activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE id = notifications.user_id
        )
    );

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE id = notifications.user_id
        )
    );

-- Super admins can view all notifications
CREATE POLICY "Super admins can view all notifications" ON notifications
    FOR SELECT USING (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE role = 'superadmin'
        )
    );

-- System can insert notifications (for service role)
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Super admins can insert notifications
CREATE POLICY "Super admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE role = 'superadmin'
        )
    );

-- RLS policies for activity logs
-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON activity_logs
    FOR SELECT USING (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE id = activity_logs.user_id
        )
    );

-- Super admins can view all activity logs
CREATE POLICY "Super admins can view all activity logs" ON activity_logs
    FOR SELECT USING (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE role = 'superadmin'
        )
    );

-- System can insert activity logs (for service role)
CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- Super admins can insert activity logs
CREATE POLICY "Super admins can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (
        auth.uid()::uuid IN (
            SELECT auth_user_id FROM users WHERE role = 'superadmin'
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on notifications
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- No mock data inserted in production

-- Create function to get unread notification count for user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER 
        FROM notifications 
        WHERE user_id = user_uuid AND read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_unread_notification_count(UUID) TO authenticated;

COMMENT ON TABLE notifications IS 'User notifications for platform activities and updates';
COMMENT ON TABLE activity_logs IS 'Audit log of all user activities in the system';
COMMENT ON FUNCTION get_unread_notification_count(UUID) IS 'Get count of unread notifications for a user';
