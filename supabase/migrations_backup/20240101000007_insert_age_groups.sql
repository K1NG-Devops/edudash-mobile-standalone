-- Insert common preschool age groups
-- These age groups are standard for most preschools and can be customized per tenant later

-- First add unique constraint to name column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'age_groups_name_key') THEN
        ALTER TABLE age_groups ADD CONSTRAINT age_groups_name_key UNIQUE (name);
    END IF;
END $$;

-- Insert age groups with conflict resolution
INSERT INTO age_groups (name, min_age, max_age, description) VALUES
  ('Infants', 0, 1, 'Ages 6 weeks to 12 months'),
  ('Young Toddlers', 1, 2, 'Ages 12 to 24 months'),
  ('Older Toddlers', 2, 3, 'Ages 2 to 3 years'),
  ('Pre-K 3', 3, 4, 'Ages 3 to 4 years (Pre-Kindergarten 3)'),
  ('Pre-K 4', 4, 5, 'Ages 4 to 5 years (Pre-Kindergarten 4)'),
  ('Kindergarten Prep', 5, 6, 'Ages 5 to 6 years (Kindergarten Preparation)')
ON CONFLICT (name) DO NOTHING; -- Prevent duplicates if script is run multiple times
