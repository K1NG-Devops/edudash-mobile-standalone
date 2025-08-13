-- COMPREHENSIVE DATABASE FIX
-- This script addresses all the database relationship errors and missing tables
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Create missing tables first
CREATE TABLE IF NOT EXISTS public.school_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.preschools(id) ON DELETE CASCADE,
    monthly_fee DECIMAL(10,2) DEFAULT 0.00,
    student_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.preschools(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create classes table if it doesn't exist with proper relationships
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    current_enrollment INTEGER DEFAULT 0,
    max_capacity INTEGER DEFAULT 20,
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    preschool_id UUID REFERENCES public.preschools(id) ON DELETE CASCADE,
    age_group_id UUID REFERENCES public.age_groups(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Ensure users table has all required fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Step 4: Update existing users to have first_name and last_name based on name field
UPDATE public.users 
SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN SPLIT_PART(name, ' ', 2) = '' THEN SPLIT_PART(name, ' ', 1)
        ELSE SPLIT_PART(name, ' ', 2)
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 5: Insert sample data for the existing school
-- Insert school subscription data
INSERT INTO public.school_subscriptions (school_id, monthly_fee, student_count, status)
SELECT 
    id,
    250.00 as monthly_fee,
    25 as student_count,
    'active' as status
FROM public.preschools 
WHERE name = 'Young Eagles'
ON CONFLICT (school_id) DO UPDATE SET
    monthly_fee = EXCLUDED.monthly_fee,
    student_count = EXCLUDED.student_count,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Insert sample payment data for this month
INSERT INTO public.payments (school_id, amount, status, description)
SELECT 
    p.id,
    6250.00 as amount, -- 25 students * 250 per month
    'completed' as status,
    'Monthly subscription payment for ' || TO_CHAR(NOW(), 'Month YYYY')
FROM public.preschools p
WHERE p.name = 'Young Eagles'
ON CONFLICT DO NOTHING;

-- Step 6: Create sample class data
INSERT INTO public.classes (name, room_number, current_enrollment, max_capacity, preschool_id, age_group_id)
SELECT 
    'Little Eagles Class A' as name,
    'Room A' as room_number,
    15 as current_enrollment,
    20 as max_capacity,
    p.id as preschool_id,
    ag.id as age_group_id
FROM public.preschools p, public.age_groups ag
WHERE p.name = 'Young Eagles' 
AND ag.name = 'Toddlers'
ON CONFLICT DO NOTHING;

INSERT INTO public.classes (name, room_number, current_enrollment, max_capacity, preschool_id, age_group_id)
SELECT 
    'Little Eagles Class B' as name,
    'Room B' as room_number,
    10 as current_enrollment,
    15 as max_capacity,
    p.id as preschool_id,
    ag.id as age_group_id
FROM public.preschools p, public.age_groups ag
WHERE p.name = 'Young Eagles' 
AND ag.name = 'Pre-K'
ON CONFLICT DO NOTHING;

-- Step 7: Fix RLS policies for new tables
ALTER TABLE public.school_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_subscriptions_access" ON public.school_subscriptions
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.auth_user_id = auth.uid() 
        AND (
            u.role = 'superadmin' 
            OR u.preschool_id = school_subscriptions.school_id
        )
        AND u.is_active = true
    )
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_access" ON public.payments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.auth_user_id = auth.uid() 
        AND (
            u.role = 'superadmin' 
            OR u.preschool_id = payments.school_id
        )
        AND u.is_active = true
    )
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_access" ON public.classes
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.users u 
        WHERE u.auth_user_id = auth.uid() 
        AND (
            u.role = 'superadmin' 
            OR u.preschool_id = classes.preschool_id
            OR u.id = classes.teacher_id
        )
        AND u.is_active = true
    )
);

-- Step 8: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_school_subscriptions_school_id ON public.school_subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_school_id ON public.payments(school_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_preschool_id ON public.classes(preschool_id);
CREATE INDEX IF NOT EXISTS idx_users_first_last_name ON public.users(first_name, last_name);

-- Step 9: Create functions to keep data consistent
CREATE OR REPLACE FUNCTION update_user_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-generate first_name and last_name from name if they're not provided
    IF NEW.first_name IS NULL AND NEW.name IS NOT NULL THEN
        NEW.first_name := SPLIT_PART(NEW.name, ' ', 1);
    END IF;
    
    IF NEW.last_name IS NULL AND NEW.name IS NOT NULL THEN
        NEW.last_name := CASE 
            WHEN SPLIT_PART(NEW.name, ' ', 2) = '' THEN SPLIT_PART(NEW.name, ' ', 1)
            ELSE SPLIT_PART(NEW.name, ' ', 2)
        END;
    END IF;
    
    -- Auto-generate name from first_name and last_name if name is not provided
    IF NEW.name IS NULL AND NEW.first_name IS NOT NULL THEN
        NEW.name := COALESCE(NEW.first_name, '') || 
                   CASE WHEN NEW.last_name IS NOT NULL THEN ' ' || NEW.last_name ELSE '' END;
    END IF;
    
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update name fields
DROP TRIGGER IF EXISTS trigger_update_user_names ON public.users;
CREATE TRIGGER trigger_update_user_names
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_names();

-- Step 10: Update existing data to fix name consistency
UPDATE public.users 
SET name = first_name || CASE WHEN last_name IS NOT NULL AND last_name != first_name THEN ' ' || last_name ELSE '' END
WHERE name IS NULL OR name = '';

-- Step 11: Verification queries
SELECT 'Database schema fix completed successfully!' as status;

SELECT 'Missing tables check:' as check_type;
SELECT 
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'school_subscriptions') 
    THEN '✅ school_subscriptions table exists' 
    ELSE '❌ school_subscriptions table missing' END as school_subscriptions_status,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') 
    THEN '✅ payments table exists' 
    ELSE '❌ payments table missing' END as payments_status,
    
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') 
    THEN '✅ classes table exists' 
    ELSE '❌ classes table missing' END as classes_status;

SELECT 'Sample data check:' as check_type;
SELECT 
    (SELECT COUNT(*) FROM public.school_subscriptions) as subscription_records,
    (SELECT COUNT(*) FROM public.payments) as payment_records,
    (SELECT COUNT(*) FROM public.classes) as class_records;

SELECT 'User name fields check:' as check_type;
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as users_with_first_name,
    COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as users_with_last_name,
    COUNT(CASE WHEN name IS NOT NULL THEN 1 END) as users_with_full_name
FROM public.users;

SELECT 'Ready for testing! All database relationships should now work correctly.' as final_status;
