-- Migration for Overage Billing System
-- Tracks usage overages and manages billing for excess usage

-- Create enum types for overage billing
CREATE TYPE overage_status AS ENUM ('none', 'approaching_limit', 'at_limit', 'exceeded');
CREATE TYPE overage_billing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Create table for tracking usage quotas by plan
CREATE TABLE plan_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_tier VARCHAR(50) NOT NULL, -- 'free', 'starter', 'premium', 'enterprise'
    quota_type VARCHAR(50) NOT NULL, -- 'aiGenerations', 'studentsPerClass', 'monthlyLessons', 'storageGB'
    monthly_limit INTEGER NOT NULL DEFAULT 0,
    annual_limit INTEGER DEFAULT NULL, -- NULL means unlimited or same as monthly * 12
    overage_unit_price DECIMAL(10,2) DEFAULT 0.00, -- Price per unit over limit (in ZAR)
    overage_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(plan_tier, quota_type)
);

-- Create table for tracking user usage
CREATE TABLE user_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL,
    usage_period_start DATE NOT NULL,
    usage_period_end DATE NOT NULL,
    current_usage INTEGER NOT NULL DEFAULT 0,
    quota_limit INTEGER NOT NULL DEFAULT 0,
    overage_amount INTEGER NOT NULL DEFAULT 0,
    overage_status overage_status DEFAULT 'none',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, quota_type, usage_period_start)
);

-- Create table for overage billing records
CREATE TABLE overage_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_tracking_id UUID NOT NULL REFERENCES user_usage_tracking(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL,
    overage_units INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ZAR',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    status overage_billing_status DEFAULT 'pending',
    payment_reference VARCHAR(255), -- PayFast payment reference
    payment_url TEXT, -- PayFast payment URL
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for overage notifications
CREATE TABLE overage_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quota_type VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'warning_75', 'warning_90', 'limit_reached', 'overage_billed'
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Insert default plan quotas
INSERT INTO plan_quotas (plan_tier, quota_type, monthly_limit, overage_unit_price, overage_enabled) VALUES
-- Free tier quotas
('free', 'aiGenerations', 5, 2.00, true), -- R2 per extra AI generation
('free', 'studentsPerClass', 3, 5.00, true), -- R5 per extra student slot
('free', 'monthlyLessons', 3, 10.00, true), -- R10 per extra lesson
('free', 'storageGB', 1, 15.00, true), -- R15 per extra GB

-- Starter tier quotas
('starter', 'aiGenerations', 25, 1.50, true), -- R1.50 per extra generation
('starter', 'studentsPerClass', 15, 3.00, true), -- R3 per extra student
('starter', 'monthlyLessons', 10, 8.00, true), -- R8 per extra lesson
('starter', 'storageGB', 5, 12.00, true), -- R12 per extra GB

-- Premium tier quotas (higher limits, lower overage costs)
('premium', 'aiGenerations', 500, 1.00, true), -- R1 per extra generation
('premium', 'studentsPerClass', 50, 2.00, true), -- R2 per extra student
('premium', 'monthlyLessons', 100, 5.00, true), -- R5 per extra lesson
('premium', 'storageGB', 50, 8.00, true), -- R8 per extra GB

-- Enterprise tier quotas (very high limits, minimal overage costs)
('enterprise', 'aiGenerations', 10000, 0.50, true), -- R0.50 per extra generation
('enterprise', 'studentsPerClass', 1000, 1.00, true), -- R1 per extra student
('enterprise', 'monthlyLessons', 1000, 2.50, true), -- R2.50 per extra lesson
('enterprise', 'storageGB', 500, 5.00, true); -- R5 per extra GB
