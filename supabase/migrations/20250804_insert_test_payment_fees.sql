-- SQL script to insert test payment fees linked to a specific user

-- Assuming the presence of necessary tables like `payment_fees`, `students`, and `parents`

INSERT INTO payment_fees (id, preschool_id, student_id, fee_type, title, description, amount, currency, due_date, is_recurring, recurring_frequency, is_overdue, is_paid, created_at, updated_at)
VALUES
  ('test_fee_1', 'mock_preschool', 'student_1', 'tuition', 'Test Tuition Fee', 'Test tuition for the month', 1000, 'ZAR', '2025-09-01', true, 'monthly', false, false, now(), now()),
  ('test_fee_2', 'mock_preschool', 'student_1', 'activity', 'Test Activity Fee', 'Test for extracurricular activity', 200, 'ZAR', '2025-09-05', false, null, false, false, now(), now()),
  ('test_fee_3', 'mock_preschool', 'student_1', 'meal', 'Test Meal Fee', 'Monthly school meal plan', 150, 'ZAR', '2025-09-10', true, 'monthly', false, false, now(), now());

-- Ensure the test fees are linked to the correct student and parent relationships
-- Insert or ensure associations as necessary
