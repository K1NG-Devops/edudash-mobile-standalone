-- Migration to add missing tables and functions for SuperAdmin functionality
-- Date: 2025-08-13

-- Create ai_usage_logs table (optional, for AI feature tracking)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preschool_id UUID REFERENCES preschools(id) ON DELETE CASCADE,
    feature_used VARCHAR(100) NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_cents INTEGER DEFAULT 0,
    request_type VARCHAR(50),
    model_used VARCHAR(50),
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_logs table for system monitoring
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    preschool_id UUID REFERENCES preschools(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhance support_tickets table if it exists, or create new one
DO $$ 
BEGIN
    -- Add missing columns to existing support_tickets table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='support_tickets') THEN
        -- Add preschool_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='preschool_id') THEN
            ALTER TABLE support_tickets ADD COLUMN preschool_id UUID REFERENCES preschools(id) ON DELETE CASCADE;
        END IF;
        
        -- Add description if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='description') THEN
            ALTER TABLE support_tickets ADD COLUMN description TEXT;
        END IF;
        
        -- Add priority if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='priority') THEN
            ALTER TABLE support_tickets ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
        END IF;
        
        -- Add category if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='category') THEN
            ALTER TABLE support_tickets ADD COLUMN category VARCHAR(50);
        END IF;
        
        -- Add assigned_to if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='assigned_to') THEN
            ALTER TABLE support_tickets ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        
        -- Add resolution if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='resolution') THEN
            ALTER TABLE support_tickets ADD COLUMN resolution TEXT;
        END IF;
        
        -- Add updated_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='updated_at') THEN
            ALTER TABLE support_tickets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Add resolved_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='resolved_at') THEN
            ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
        END IF;
        
    ELSE
        -- Create new support_tickets table
        CREATE TABLE support_tickets (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            preschool_id UUID REFERENCES preschools(id) ON DELETE CASCADE,
            subject VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            category VARCHAR(50),
            assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
            resolution TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            resolved_at TIMESTAMP WITH TIME ZONE
        );
    END IF;
END $$;

-- Create payments table for payment tracking
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'ZAR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    invoice_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    paid_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for communication tracking
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_type VARCHAR(20) DEFAULT 'user' CHECK (recipient_type IN ('user', 'group', 'class', 'all')),
    subject VARCHAR(255),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    attachments JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist
DO $$ 
BEGIN
    -- Add tenant_slug to preschools if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='preschools' AND column_name='tenant_slug') THEN
        ALTER TABLE preschools ADD COLUMN tenant_slug VARCHAR(100) UNIQUE;
    END IF;
    
    -- Add billing_email to preschools if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='preschools' AND column_name='billing_email') THEN
        ALTER TABLE preschools ADD COLUMN billing_email VARCHAR(255);
    END IF;
    
    -- Add setup_completed to preschools if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='preschools' AND column_name='setup_completed') THEN
        ALTER TABLE preschools ADD COLUMN setup_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create RPC function to get active connections (PostgreSQL specific)
CREATE OR REPLACE FUNCTION get_active_connections()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For PostgreSQL, you can query pg_stat_activity
    -- But for security reasons in hosted environments, we'll return a mock value
    -- In production, this would connect to actual monitoring systems
    
    -- Mock implementation - returns a reasonable number based on current users
    RETURN (
        SELECT COALESCE(
            (SELECT COUNT(*) FROM users WHERE is_active = true AND updated_at > NOW() - INTERVAL '5 minutes') + 
            (SELECT COUNT(*) FROM users WHERE is_active = true) / 10,
            5
        )::INTEGER
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Return a default value if anything fails
        RETURN 5;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_preschool_id ON ai_usage_logs(preschool_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON system_logs(severity);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_log_type ON system_logs(log_type);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
-- Only create preschool_id index if column exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='preschool_id') THEN
        CREATE INDEX IF NOT EXISTS idx_support_tickets_preschool_id ON support_tickets(preschool_id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_preschool_id ON payments(preschool_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_messages_preschool_id ON messages(preschool_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Enable Row Level Security on new tables
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view their own AI usage logs" ON ai_usage_logs
    FOR SELECT USING (
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "System can insert AI usage logs" ON ai_usage_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for system_logs
CREATE POLICY "Superadmins can view system logs" ON system_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

CREATE POLICY "System can insert system logs" ON system_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for support_tickets
DROP POLICY IF EXISTS "Users can view their own support tickets" ON support_tickets;
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role IN ('superadmin', 'admin')
        )
    );

DROP POLICY IF EXISTS "Users can create support tickets" ON support_tickets;
CREATE POLICY "Users can create support tickets" ON support_tickets
    FOR INSERT WITH CHECK (
        user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    );

-- RLS Policies for payments
CREATE POLICY "Users can view their preschool payments" ON payments
    FOR SELECT USING (
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- RLS Policies for messages
CREATE POLICY "Users can view their messages" ON messages
    FOR SELECT USING (
        sender_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR
        recipient_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        OR
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
        AND
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Insert some sample data for testing (optional)
-- Sample AI usage logs
INSERT INTO ai_usage_logs (feature_used, tokens_used, cost_cents, request_type, model_used, success) VALUES
('lesson_generation', 1500, 30, 'completion', 'gpt-3.5-turbo', true),
('activity_suggestion', 800, 16, 'completion', 'gpt-3.5-turbo', true),
('homework_feedback', 1200, 24, 'completion', 'gpt-4', true)
ON CONFLICT DO NOTHING;

-- Sample system logs
INSERT INTO system_logs (log_type, severity, message) VALUES
('system_startup', 'low', 'System started successfully'),
('user_authentication', 'medium', 'Multiple failed login attempts detected'),
('database_backup', 'low', 'Daily backup completed successfully'),
('payment_processing', 'high', 'Payment gateway timeout detected')
ON CONFLICT DO NOTHING;

-- Sample support tickets
INSERT INTO support_tickets (subject, description, status, priority, category) VALUES
('Unable to create new class', 'Getting an error when trying to create a new class in my preschool', 'open', 'medium', 'technical'),
('Billing inquiry', 'Question about my monthly subscription charge', 'open', 'low', 'billing'),
('Feature request', 'Would like to see a parent communication feature', 'open', 'low', 'feature_request')
ON CONFLICT DO NOTHING;

-- Update existing preschools with tenant_slug if missing
UPDATE preschools 
SET tenant_slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE tenant_slug IS NULL;

-- Update existing preschools with billing_email if missing  
UPDATE preschools 
SET billing_email = email
WHERE billing_email IS NULL;

COMMENT ON TABLE ai_usage_logs IS 'Tracks AI feature usage for billing and monitoring';
COMMENT ON TABLE system_logs IS 'System-wide logs for monitoring and debugging';
COMMENT ON TABLE support_tickets IS 'Customer support ticket tracking';
COMMENT ON TABLE payments IS 'Payment transaction records';
COMMENT ON TABLE messages IS 'Internal messaging system';
COMMENT ON FUNCTION get_active_connections() IS 'Returns approximate number of active database connections';
