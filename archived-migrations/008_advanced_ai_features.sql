-- Database Schema Updates for Advanced AI Features and Individual Users
-- Migration: 008_advanced_ai_features.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add new subscription tiers and user types
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'institutional';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_individual_user BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_features_enabled JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS quantum_consciousness_level INTEGER DEFAULT 0;

-- Update preschools table to support individual families
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS is_virtual_institution BOOLEAN DEFAULT false;
ALTER TABLE preschools ADD COLUMN IF NOT EXISTS institution_type VARCHAR(50) DEFAULT 'preschool';

-- Create individual_families table for non-institutional users
CREATE TABLE IF NOT EXISTS individual_families (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_name VARCHAR(255) NOT NULL,
    primary_guardian_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    children_count INTEGER DEFAULT 0,
    homeschool_registered BOOLEAN DEFAULT false,
    country_code VARCHAR(10) DEFAULT 'ZA',
    currency VARCHAR(10) DEFAULT 'ZAR',
    ai_usage_quota JSONB DEFAULT '{"lessons_per_day": 5, "ai_tutors": 1}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create independent_educators table for tutors/teachers not affiliated with institutions
CREATE TABLE IF NOT EXISTS independent_educators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    educator_name VARCHAR(255) NOT NULL,
    specializations TEXT[],
    education_levels TEXT[],
    max_students INTEGER DEFAULT 10,
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB,
    qualifications JSONB,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    ai_features_quota JSONB DEFAULT '{"lessons_per_day": 5, "ai_tutors": 1}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_tutors table for managing AI tutors
CREATE TABLE IF NOT EXISTS ai_tutors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    owner_type VARCHAR(50) NOT NULL, -- 'institution', 'individual_family', 'independent_educator'
    intelligence_level VARCHAR(50) DEFAULT 'basic',
    specializations TEXT[],
    personality_matrix JSONB NOT NULL,
    neural_network_config JSONB NOT NULL,
    holographic_avatar BOOLEAN DEFAULT false,
    temporal_awareness BOOLEAN DEFAULT false,
    multiverse_access BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_stats JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create neural_networks table
CREATE TABLE IF NOT EXISTS neural_networks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    network_type VARCHAR(50) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    owner_type VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    training_status VARCHAR(50) DEFAULT 'initializing',
    performance_metrics JSONB DEFAULT '{}',
    training_data_sources TEXT[],
    last_trained_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create holographic_lessons table
CREATE TABLE IF NOT EXISTS holographic_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    dimension VARCHAR(20) NOT NULL DEFAULT '2D',
    reality_type VARCHAR(50) NOT NULL DEFAULT 'standard',
    interaction_modes JSONB NOT NULL,
    neural_feedback BOOLEAN DEFAULT false,
    brain_interface_compatible BOOLEAN DEFAULT false,
    time_travel_elements BOOLEAN DEFAULT false,
    dimensional_coordinates FLOAT[],
    quantum_state VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quantum_analytics table
CREATE TABLE IF NOT EXISTS quantum_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    analytics_type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL,
    confidence_level FLOAT DEFAULT 0.8,
    quantum_uncertainty FLOAT DEFAULT 0.1,
    multiverse_convergence FLOAT DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Create learning_patterns table
CREATE TABLE IF NOT EXISTS learning_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pattern_id VARCHAR(255) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    learning_style VARCHAR(50) NOT NULL,
    optimal_time_of_day VARCHAR(50),
    attention_span_minutes INTEGER,
    comprehension_rate FLOAT,
    retention_rate FLOAT,
    neural_pathway_efficiency FLOAT,
    quantum_entanglement_level FLOAT DEFAULT 0,
    ai_confidence FLOAT DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create temporal_predictions table (for time travel analytics)
CREATE TABLE IF NOT EXISTS temporal_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id VARCHAR(255) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    future_performance FLOAT,
    confidence_interval FLOAT,
    timeline_variance JSONB,
    quantum_uncertainty FLOAT,
    multiverse_convergence FLOAT,
    predicted_outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    prediction_for_date DATE,
    reality_index INTEGER DEFAULT 1
);

-- Create parallel_realities table (for enterprise tier)
CREATE TABLE IF NOT EXISTS parallel_realities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reality_id VARCHAR(255) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    alternative_outcome TEXT,
    probability FLOAT,
    improvement_potential FLOAT,
    required_interventions TEXT[],
    reality_divergence_point TIMESTAMP,
    dimensional_coordinates FLOAT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create neural_metrics table (for brain interface features)
CREATE TABLE IF NOT EXISTS neural_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_id VARCHAR(255) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    brain_wave_patterns JSONB,
    cognitive_load FLOAT,
    neural_plasticity FLOAT,
    synaptic_activity FLOAT,
    quantum_coherence FLOAT DEFAULT 0,
    measurement_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(255), -- Neural interface device
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create holographic_interactions table
CREATE TABLE IF NOT EXISTS holographic_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interaction_id VARCHAR(255) UNIQUE NOT NULL,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    holographic_lesson_id UUID REFERENCES holographic_lessons(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL,
    duration_ms INTEGER,
    engagement_level FLOAT,
    learning_effectiveness FLOAT,
    dimensional_coordinates FLOAT[],
    quantum_state VARCHAR(100),
    ai_response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create ai_usage_tracking table for monitoring AI features usage
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 1,
    subscription_tier VARCHAR(20),
    quota_limit INTEGER,
    quota_used INTEGER,
    cost_credits DECIMAL(10, 4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, feature_type, usage_date)
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(50) UNIQUE NOT NULL,
    plan_tier VARCHAR(20) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'ZAR',
    features JSONB NOT NULL,
    ai_quota JSONB NOT NULL,
    max_students INTEGER,
    max_tutors INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, plan_tier, display_name, description, price_monthly, price_yearly, features, ai_quota, max_students, max_tutors) 
VALUES 
('neural-starter', 'free', 'Neural Starter', 'Perfect for quantum beginners', 0, 0, 
 '{"holographic_lessons": false, "neural_networks": ["basic"], "brain_interface": false, "time_travel_analytics": false, "metaverse_access": true}',
 '{"ai_lessons_per_day": 5, "ai_students_limit": 10, "robotic_tutors": 1}', 10, 1),
 
('quantum-pro', 'premium', 'Quantum Pro', 'Advanced Society 5.0 features', 499, 4990,
 '{"holographic_lessons": true, "neural_networks": ["basic", "advanced", "deep_learning"], "brain_interface": "neural_interface", "time_travel_analytics": false, "metaverse_access": true, "multi_metaverse": true}',
 '{"ai_lessons_per_day": -1, "ai_students_limit": -1, "robotic_tutors": 5}', -1, 5),
 
('singularity', 'enterprise', 'Singularity', 'Transcend educational boundaries', 999, 9990,
 '{"holographic_lessons": true, "holographic_4d": true, "neural_networks": ["basic", "advanced", "quantum_ai", "consciousness"], "brain_interface": "direct_brain_upload", "time_travel_analytics": true, "omniverse_access": true, "god_mode": true}',
 '{"ai_lessons_per_day": -1, "ai_students_limit": -1, "robotic_tutors": -1}', -1, -1)
ON CONFLICT (plan_name) DO NOTHING;

-- Update students table to support individual users
ALTER TABLE students ADD COLUMN IF NOT EXISTS individual_family_id UUID REFERENCES individual_families(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS independent_educator_id UUID REFERENCES independent_educators(id) ON DELETE SET NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS neural_profile JSONB DEFAULT '{}';
ALTER TABLE students ADD COLUMN IF NOT EXISTS quantum_learning_level INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_is_individual ON users(is_individual_user);
CREATE INDEX IF NOT EXISTS idx_ai_usage_tracking_user_date ON ai_usage_tracking(user_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_learning_patterns_student_id ON learning_patterns(student_id);
CREATE INDEX IF NOT EXISTS idx_quantum_analytics_student_id ON quantum_analytics(student_id);
CREATE INDEX IF NOT EXISTS idx_holographic_interactions_student_lesson ON holographic_interactions(student_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_neural_metrics_student_timestamp ON neural_metrics(student_id, measurement_timestamp);

-- Create RLS policies for individual users

-- Policy for individual_families table
ALTER TABLE individual_families ENABLE ROW LEVEL SECURITY;
CREATE POLICY individual_families_policy ON individual_families
    FOR ALL USING (
        primary_guardian_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin')
        )
    );

-- Policy for independent_educators table
ALTER TABLE independent_educators ENABLE ROW LEVEL SECURITY;
CREATE POLICY independent_educators_policy ON independent_educators
    FOR ALL USING (
        user_id = auth.uid() OR
        user_id IN (
            SELECT u.id FROM users u 
            WHERE u.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin')
        )
    );

-- Policy for ai_tutors table
ALTER TABLE ai_tutors ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_tutors_policy ON ai_tutors
    FOR ALL USING (
        owner_id IN (
            SELECT u.id FROM users u 
            WHERE u.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin')
        )
    );

-- Policy for neural_networks table
ALTER TABLE neural_networks ENABLE ROW LEVEL SECURITY;
CREATE POLICY neural_networks_policy ON neural_networks
    FOR ALL USING (
        owner_id IN (
            SELECT u.id FROM users u 
            WHERE u.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin')
        )
    );

-- Policy for quantum_analytics table
ALTER TABLE quantum_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY quantum_analytics_policy ON quantum_analytics
    FOR ALL USING (
        student_id IN (
            SELECT s.id FROM students s 
            JOIN users u ON s.parent_id = u.id 
            WHERE u.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin', 'teacher', 'principal')
        )
    );

-- Policy for ai_usage_tracking table
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_tracking_policy ON ai_usage_tracking
    FOR ALL USING (
        user_id IN (
            SELECT u.id FROM users u 
            WHERE u.auth_user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND u.role IN ('super_admin')
        )
    );

-- Create functions for AI usage tracking and quota management

CREATE OR REPLACE FUNCTION check_ai_usage_quota(
    p_user_id UUID,
    p_feature_type VARCHAR(50),
    p_usage_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
    user_tier VARCHAR(20);
    plan_quota JSONB;
    current_usage INTEGER;
    quota_limit INTEGER;
    result JSON;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users WHERE id = p_user_id;
    
    -- Get plan quota
    SELECT ai_quota INTO plan_quota
    FROM subscription_plans 
    WHERE plan_tier = user_tier AND is_active = true
    LIMIT 1;
    
    -- Get current usage
    SELECT COALESCE(usage_count, 0) INTO current_usage
    FROM ai_usage_tracking
    WHERE user_id = p_user_id 
    AND feature_type = p_feature_type 
    AND usage_date = p_usage_date;
    
    -- Extract quota limit for this feature
    quota_limit := CASE 
        WHEN p_feature_type = 'lesson_generation' THEN (plan_quota->>'ai_lessons_per_day')::INTEGER
        WHEN p_feature_type = 'ai_tutoring' THEN (plan_quota->>'robotic_tutors')::INTEGER
        ELSE -1
    END;
    
    -- Build result
    SELECT json_build_object(
        'allowed', CASE WHEN quota_limit = -1 OR current_usage < quota_limit THEN true ELSE false END,
        'current_usage', current_usage,
        'quota_limit', quota_limit,
        'remaining', CASE WHEN quota_limit = -1 THEN -1 ELSE GREATEST(0, quota_limit - current_usage) END,
        'subscription_tier', user_tier
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment AI usage
CREATE OR REPLACE FUNCTION increment_ai_usage(
    p_user_id UUID,
    p_feature_type VARCHAR(50),
    p_usage_count INTEGER DEFAULT 1,
    p_usage_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    quota_check JSON;
BEGIN
    -- Check quota first
    quota_check := check_ai_usage_quota(p_user_id, p_feature_type, p_usage_date);
    
    -- Only increment if allowed
    IF (quota_check->>'allowed')::BOOLEAN THEN
        INSERT INTO ai_usage_tracking (user_id, feature_type, usage_date, usage_count, subscription_tier)
        VALUES (p_user_id, p_feature_type, p_usage_date, p_usage_count, 
                (SELECT subscription_tier FROM users WHERE id = p_user_id))
        ON CONFLICT (user_id, feature_type, usage_date) 
        DO UPDATE SET 
            usage_count = ai_usage_tracking.usage_count + p_usage_count,
            updated_at = CURRENT_TIMESTAMP;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's available AI features
CREATE OR REPLACE FUNCTION get_user_ai_features(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    user_tier VARCHAR(20);
    plan_features JSONB;
    plan_quota JSONB;
    result JSON;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier
    FROM users WHERE id = p_user_id;
    
    -- Get plan features and quota
    SELECT features, ai_quota INTO plan_features, plan_quota
    FROM subscription_plans 
    WHERE plan_tier = user_tier AND is_active = true
    LIMIT 1;
    
    -- Build comprehensive result
    SELECT json_build_object(
        'subscription_tier', user_tier,
        'features', plan_features,
        'quota', plan_quota,
        'holographic_lessons', COALESCE((plan_features->>'holographic_lessons')::BOOLEAN, false),
        'neural_networks', plan_features->'neural_networks',
        'brain_interface', plan_features->>'brain_interface',
        'time_travel_analytics', COALESCE((plan_features->>'time_travel_analytics')::BOOLEAN, false),
        'god_mode', COALESCE((plan_features->>'god_mode')::BOOLEAN, false)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
CREATE TRIGGER update_individual_families_updated_at BEFORE UPDATE ON individual_families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_independent_educators_updated_at BEFORE UPDATE ON independent_educators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_tutors_updated_at BEFORE UPDATE ON ai_tutors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_neural_networks_updated_at BEFORE UPDATE ON neural_networks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_holographic_lessons_updated_at BEFORE UPDATE ON holographic_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_patterns_updated_at BEFORE UPDATE ON learning_patterns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON individual_families TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON independent_educators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_tutors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON neural_networks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON holographic_lessons TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON quantum_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON temporal_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON parallel_realities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON neural_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON holographic_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_usage_tracking TO authenticated;
GRANT SELECT ON subscription_plans TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION check_ai_usage_quota(UUID, VARCHAR, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_ai_usage(UUID, VARCHAR, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ai_features(UUID) TO authenticated;
