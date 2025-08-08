-- Insert test payment fees for school fees, activities, excursions, and other
-- Run this directly in the Supabase SQL editor

-- First check if we have the user and student data
DO $$
DECLARE
    user_record RECORD;
    student_record RECORD;
BEGIN
    -- Get user info
    SELECT id, preschool_id INTO user_record 
    FROM users 
    WHERE auth_user_id = '97d63f12-45fc-4561-aac7-c975f9081594';
    
    IF user_record.id IS NULL THEN
        RAISE NOTICE 'User not found with auth_user_id: 97d63f12-45fc-4561-aac7-c975f9081594';
        RETURN;
    END IF;
    
    -- Get student info
    SELECT id INTO student_record
    FROM students 
    WHERE parent_id = user_record.id AND is_active = true
    LIMIT 1;
    
    IF student_record.id IS NULL THEN
        RAISE NOTICE 'No active students found for user: %', user_record.id;
        RETURN;
    END IF;
    
    -- Insert test payment fees
    INSERT INTO payment_fees (
        preschool_id,
        student_id,
        fee_type,
        title,
        description,
        amount,
        currency,
        due_date,
        is_recurring,
        recurring_frequency,
        is_paid
    ) VALUES
    (
        user_record.preschool_id,
        student_record.id,
        'tuition',
        'Quarter 1 School Fees',
        'Fees for the first quarter of 2025',
        2500.00,
        'ZAR',
        '2025-01-15',
        false,
        null,
        false
    ),
    (
        user_record.preschool_id,
        student_record.id,
        'activity',
        'Art Excursion Fee',
        'Fee for art museum visit',
        300.00,
        'ZAR',
        '2025-02-20',
        false,
        null,
        false
    ),
    (
        user_record.preschool_id,
        student_record.id,
        'other',
        'Other Charges',
        'Miscellaneous school-related charges',
        150.00,
        'ZAR',
        '2025-03-05',
        false,
        null,
        false
    );
    
    RAISE NOTICE 'Successfully inserted 3 test payment fees for student: %', student_record.id;
END $$;
