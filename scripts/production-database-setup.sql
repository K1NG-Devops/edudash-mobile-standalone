-- Production Database Setup for EduDash Pro
-- This script cleans all mock/demo data and sets up production-ready database
-- Run with: psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/production-database-setup.sql

\echo '🚀 PRODUCTION DATABASE SETUP'
\echo '============================'

-- Step 1: Clean all mock/demo/test data
\echo 'Step 1: Cleaning mock data...'

-- Delete all demo/test users except we'll recreate proper superadmin
DELETE FROM users;

-- Delete all demo preschools
DELETE FROM preschools;

-- Delete all demo students  
DELETE FROM students;

-- Delete all demo/sample data
DELETE FROM notifications;
DELETE FROM messages;
DELETE FROM support_tickets;
DELETE FROM system_logs;
DELETE FROM ai_usage_logs;
DELETE FROM payments;
DELETE FROM payment_fees;
DELETE FROM payment_receipts;
DELETE FROM homework_assignments;
DELETE FROM homework_submissions;
DELETE FROM lesson_categories;
DELETE FROM lessons;
DELETE FROM activities;
DELETE FROM classes;
DELETE FROM age_groups;
DELETE FROM announcements;
DELETE FROM events;
DELETE FROM assessments;

\echo 'Mock data cleaned.'

-- Step 2: Insert essential seed data for production
\echo 'Step 2: Inserting production seed data...'

-- Insert default age groups (these are standard preschool age groups)
INSERT INTO age_groups (id, name, min_age, max_age, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Toddlers', 1, 2, 'Ages 1-2 years'),
('22222222-2222-2222-2222-222222222222', 'Early Preschool', 2, 3, 'Ages 2-3 years'), 
('33333333-3333-3333-3333-333333333333', 'Preschool', 3, 4, 'Ages 3-4 years'),
('44444444-4444-4444-4444-444444444444', 'Pre-K', 4, 5, 'Ages 4-5 years'),
('55555555-5555-5555-5555-555555555555', 'Kindergarten Prep', 5, 6, 'Ages 5-6 years');

-- Insert default lesson categories
INSERT INTO lesson_categories (id, name, description, icon_name, color_theme) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Math & Numbers', 'Basic math concepts and number recognition', 'calculator', 'blue'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Language & Literacy', 'Reading, writing, and language development', 'book', 'green'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Science & Nature', 'Exploring the world around us', 'leaf', 'orange'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Arts & Creativity', 'Creative expression through art and crafts', 'palette', 'purple'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Physical Development', 'Gross and fine motor skills development', 'fitness', 'red'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Social & Emotional', 'Building social skills and emotional intelligence', 'heart', 'pink');

\echo 'Essential seed data inserted.'

-- Step 3: Create production superadmin (will be updated when actual superadmin registers)
\echo 'Step 3: Creating placeholder superadmin...'

INSERT INTO users (id, name, email, role, is_active, created_at) VALUES
('99999999-9999-9999-9999-999999999999', 'System Administrator', 'admin@edudashpro.com', 'superadmin', true, NOW());

\echo 'Production superadmin placeholder created.'

-- Step 4: Create database function to properly link authenticated users
\echo 'Step 4: Creating user authentication functions...'

-- Function to create or update user profile when they authenticate
CREATE OR REPLACE FUNCTION handle_new_user_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user authenticates, either create their profile or update auth_user_id
    INSERT INTO users (auth_user_id, email, name, role, is_active, created_at)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
        true,
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        auth_user_id = NEW.id,
        updated_at = NOW()
    WHERE users.auth_user_id IS NULL;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically handle user authentication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_auth();

\echo 'Authentication functions created.'

-- Step 5: Create superadmin registration function
\echo 'Step 5: Creating superadmin registration system...'

-- Function to register the first superadmin
CREATE OR REPLACE FUNCTION register_superadmin(
    p_email TEXT,
    p_password TEXT,
    p_name TEXT DEFAULT 'Super Administrator'
)
RETURNS JSON AS $$
DECLARE
    new_auth_user_id UUID;
    result JSON;
BEGIN
    -- Check if any superadmin already exists
    IF EXISTS (SELECT 1 FROM users WHERE role = 'superadmin' AND auth_user_id IS NOT NULL) THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'A superadmin already exists'
        );
    END IF;
    
    -- This would normally create the auth user, but we'll handle this in the app
    -- Just update the placeholder superadmin with proper email
    UPDATE users 
    SET email = p_email, name = p_name
    WHERE role = 'superadmin' AND auth_user_id IS NULL;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Superadmin placeholder updated. Complete registration in the app.'
    );
END;
$$ LANGUAGE plpgsql;

\echo 'Superadmin registration function created.'

-- Step 6: Final cleanup - remove any remaining debug/test data
\echo 'Step 6: Final cleanup...'

-- Remove any debug/console log entries from system_logs
DELETE FROM system_logs WHERE message LIKE '%debug%' OR message LIKE '%test%' OR message LIKE '%console%';

\echo 'Database cleanup completed.'

-- Step 7: Production database summary
\echo 'Step 7: Production database summary...'

SELECT 'Production Database Ready!' as status;

SELECT 
    'Total Tables:' as metric, 
    COUNT(*)::TEXT as value
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT 
    'Age Groups:' as data_type,
    COUNT(*)::TEXT as count
FROM age_groups
UNION ALL
SELECT 
    'Lesson Categories:',
    COUNT(*)::TEXT
FROM lesson_categories
UNION ALL
SELECT 
    'Users (Placeholder):',
    COUNT(*)::TEXT  
FROM users;

\echo ''
\echo '✅ PRODUCTION DATABASE READY!'
\echo ''
\echo '📋 NEXT STEPS:'
\echo '1. The first user to register with admin@edudashpro.com will become the superadmin'
\echo '2. All mock/demo data has been removed'  
\echo '3. Essential seed data (age groups, lesson categories) is ready'
\echo '4. Database is ready for production deployment'
\echo ''
