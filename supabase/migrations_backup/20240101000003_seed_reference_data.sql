-- Insert age groups
INSERT INTO age_groups (name, min_age, max_age, description) VALUES
('Toddlers', 1, 3, 'Early development activities for ages 1-3'),
('Pre-K', 4, 6, 'Pre-kindergarten preparation for ages 4-6')
ON CONFLICT DO NOTHING;

-- Insert lesson categories
INSERT INTO lesson_categories (name, description, icon, color) VALUES
('Robotics & STEM', 'Introduction to robotics, coding concepts, and STEM activities', 'robot', '#3B82F6'),
('AI & Technology', 'Age-appropriate AI concepts and digital literacy', 'brain', '#8B5CF6'),
('Computer Skills', 'Basic computer operations, mouse/keyboard skills, digital safety', 'monitor', '#10B981'),
('Phonics & Reading', 'Letter recognition, phonetic sounds, early reading skills', 'book-open', '#F59E0B'),
('Numbers & Math', 'Counting, number recognition, basic math concepts', '123', '#EF4444'),
('Creative Arts', 'Drawing, painting, music, and creative expression', 'palette', '#EC4899'),
('Physical Development', 'Motor skills, coordination, and physical activities', 'activity', '#06B6D4'),
('Social Skills', 'Communication, sharing, empathy, and social interaction', 'users', '#84CC16')
ON CONFLICT DO NOTHING;
