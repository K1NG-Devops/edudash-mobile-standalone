-- Add test payment fees for the current user (Zanele Makunyane)
-- Based on the logs, the user auth_user_id is: 97d63f12-45fc-4561-aac7-c975f9081594

-- First, let's get the user and student IDs we need
WITH user_info AS (
  SELECT id as parent_id, preschool_id
  FROM users 
  WHERE auth_user_id = '97d63f12-45fc-4561-aac7-c975f9081594'
),
student_info AS (
  SELECT s.id as student_id, ui.parent_id, ui.preschool_id
  FROM students s
  JOIN user_info ui ON s.parent_id = ui.parent_id
  WHERE s.is_active = true
  LIMIT 1
)
-- Insert test payment fees
INSERT INTO payment_fees (
  preschool_id,
  student_id,
  fee_type,
  fee_name,
  title,
  description,
  amount,
  currency,
  due_date,
  is_recurring,
  recurring_frequency,
  is_paid,
  is_overdue
)
SELECT 
  si.preschool_id,
  si.student_id,
  'tuition',
  'January 2025 Tuition',
  'January Tuition Fee',
  'Monthly preschool tuition and educational activities',
  1200.00,
  'ZAR',
  '2025-01-15',
  true,
  'monthly',
  false,
  false
FROM student_info si

UNION ALL

SELECT 
  si.preschool_id,
  si.student_id,
  'activity',
  'Arts & Crafts Materials',
  'Arts & Crafts Materials',
  'Materials for creative activities and art projects',
  150.00,
  'ZAR',
  '2025-01-20',
  false,
  null,
  false,
  false
FROM student_info si

UNION ALL

SELECT 
  si.preschool_id,
  si.student_id,
  'meal',
  'December 2024 Lunch',
  'School Lunch Program',
  'Nutritious meals and snacks for December (OVERDUE)',
  300.00,
  'ZAR',
  '2024-12-20',
  true,
  'monthly',
  false,
  true
FROM student_info si

UNION ALL

SELECT 
  si.preschool_id,
  si.student_id,
  'transport',
  'January 2025 Transport',
  'School Transport',
  'Safe transportation to and from school',
  250.00,
  'ZAR',
  '2025-01-10',
  true,
  'monthly',
  false,
  false
FROM student_info si;

-- Verify the fees were added
SELECT 
  pf.id,
  pf.fee_name,
  pf.amount,
  pf.due_date,
  pf.is_overdue,
  s.first_name || ' ' || s.last_name as student_name
FROM payment_fees pf
JOIN students s ON pf.student_id = s.id
JOIN users u ON s.parent_id = u.id
WHERE u.auth_user_id = '97d63f12-45fc-4561-aac7-c975f9081594'
ORDER BY pf.due_date;
