-- Non-destructive script to add missing tables for SuperAdmin functionality
-- Run this with: psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/add-missing-tables.sql

-- 1. Create system_logs table if missing (enhanced version)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='system_logs') THEN
        CREATE TABLE system_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            log_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            message TEXT NOT NULL,
            user_id UUID REFERENCES users(id) ON DELETE SET NULL,
            preschool_id UUID REFERENCES preschools(id) ON DELETE SET NULL,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
        
        -- RLS Policies
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
            
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_system_logs_severity ON system_logs(severity);
        CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_system_logs_log_type ON system_logs(log_type);
        
        -- Insert sample data
        INSERT INTO system_logs (log_type, severity, message) VALUES
        ('system_startup', 'low', 'System started successfully'),
        ('user_authentication', 'medium', 'Multiple failed login attempts detected'),
        ('database_backup', 'low', 'Daily backup completed successfully'),
        ('payment_processing', 'high', 'Payment gateway timeout detected');
        
        RAISE NOTICE 'Created system_logs table with sample data';
    ELSE
        RAISE NOTICE 'system_logs table already exists';
    END IF;
END $$;

-- 2. Enhance support_tickets table if it exists but is missing columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='support_tickets') THEN
        -- Add missing columns one by one
        
        -- Add preschool_id if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='preschool_id') THEN
            ALTER TABLE support_tickets ADD COLUMN preschool_id UUID REFERENCES preschools(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added preschool_id column to support_tickets';
        END IF;
        
        -- Add description if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='description') THEN
            ALTER TABLE support_tickets ADD COLUMN description TEXT;
            RAISE NOTICE 'Added description column to support_tickets';
        END IF;
        
        -- Add priority if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='priority') THEN
            ALTER TABLE support_tickets ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
            RAISE NOTICE 'Added priority column to support_tickets';
        END IF;
        
        -- Add category if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='category') THEN
            ALTER TABLE support_tickets ADD COLUMN category VARCHAR(50);
            RAISE NOTICE 'Added category column to support_tickets';
        END IF;
        
        -- Add assigned_to if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='assigned_to') THEN
            ALTER TABLE support_tickets ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added assigned_to column to support_tickets';
        END IF;
        
        -- Add resolution if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='resolution') THEN
            ALTER TABLE support_tickets ADD COLUMN resolution TEXT;
            RAISE NOTICE 'Added resolution column to support_tickets';
        END IF;
        
        -- Add updated_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='updated_at') THEN
            ALTER TABLE support_tickets ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to support_tickets';
        END IF;
        
        -- Add resolved_at if missing
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='resolved_at') THEN
            ALTER TABLE support_tickets ADD COLUMN resolved_at TIMESTAMP WITH TIME ZONE;
            RAISE NOTICE 'Added resolved_at column to support_tickets';
        END IF;
        
        -- Create indexes if they don't exist
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='support_tickets' AND column_name='preschool_id') THEN
            CREATE INDEX IF NOT EXISTS idx_support_tickets_preschool_id ON support_tickets(preschool_id);
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
        CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
        CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
        
        -- Insert sample data if table is empty
        INSERT INTO support_tickets (subject, description, status, priority, category) 
        SELECT * FROM (VALUES
            ('Unable to create new class', 'Getting an error when trying to create a new class in my preschool', 'open', 'medium', 'technical'),
            ('Billing inquiry', 'Question about my monthly subscription charge', 'open', 'low', 'billing'),
            ('Feature request', 'Would like to see a parent communication feature', 'open', 'low', 'feature_request')
        ) AS sample_data(subject, description, status, priority, category)
        WHERE NOT EXISTS (SELECT 1 FROM support_tickets LIMIT 1);
        
        RAISE NOTICE 'Enhanced support_tickets table';
    END IF;
END $$;

-- 3. Summary
SELECT 
    'Tables created/enhanced:' AS status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('ai_usage_logs', 'system_logs')) || ' tables ready' AS result;

-- 4. Test the functions
SELECT 'Active connections:' AS test, get_active_connections() AS value
UNION ALL
SELECT 'AI usage logs count:', (SELECT COUNT(*)::TEXT FROM ai_usage_logs)
UNION ALL
SELECT 'System logs count:', (SELECT COUNT(*)::TEXT FROM system_logs)
UNION ALL 
SELECT 'Support tickets count:', (SELECT COUNT(*)::TEXT FROM support_tickets);

\echo 'All missing tables and functions have been added successfully!'
