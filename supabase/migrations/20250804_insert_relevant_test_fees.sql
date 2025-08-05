-- SQL script to insert relevant test payment fees

-- Assuming the presence of necessary tables like `payment_fees`, `students`, and `parents` and using the user auth_user_id.

-- Get the user and student IDs
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
  title,
  description,
  amount,
  currency,
  due_date,
  is_recurring,
  recurring_frequency,
  is_paid
)
SELECT 
  si.preschool_id,
  si.student_id,
  'tuition',
  'Quarter 1 School Fees',
  'Fees for the first quarter of 2025',
  2500.00,
  'ZAR',
  '2025-01-15',
  false,
  null,
  false
FROM student_info si

UNION ALL

SELECT 
  si.preschool_id,
  si.student_id,
  'activity',
  'Art Excursion Fee',
  'Fee for art museum visit',
  300.00,
  'ZAR',
  '2025-02-20',
  false,
  null,
  false
FROM student_info si

UNION ALL

SELECT 
  si.preschool_id,
  si.student_id,
  'other',
  'Other Charges',
  'Miscellaneous school-related charges',
  150.00,
  'ZAR',
  '2025-03-05',
  false,
  null,
  false
FROM student_info si;
