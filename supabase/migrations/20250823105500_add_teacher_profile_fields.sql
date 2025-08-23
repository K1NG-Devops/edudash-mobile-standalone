-- Add comprehensive teacher profile fields to users table
-- This will allow principals to manage detailed teacher profiles

-- Add personal information fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
ADD COLUMN IF NOT EXISTS nationality TEXT DEFAULT 'South African',
ADD COLUMN IF NOT EXISTS id_number TEXT, -- South African ID or passport number
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;

-- Add address fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state_province TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'South Africa';

-- Add professional information
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS position_title TEXT,
ADD COLUMN IF NOT EXISTS employment_start_date DATE,
ADD COLUMN IF NOT EXISTS employment_status TEXT CHECK (employment_status IN ('full_time', 'part_time', 'contract', 'substitute', 'intern')) DEFAULT 'full_time',
ADD COLUMN IF NOT EXISTS salary_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS salary_currency TEXT DEFAULT 'ZAR';

-- Add qualifications and certifications
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS highest_qualification TEXT,
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS qualification_year INTEGER,
ADD COLUMN IF NOT EXISTS certifications TEXT[], -- Array of certification names
ADD COLUMN IF NOT EXISTS teaching_experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subjects_taught TEXT[], -- Array of subjects
ADD COLUMN IF NOT EXISTS age_groups_taught TEXT[]; -- Array like ['3-4 years', '5-6 years']

-- Add additional profile fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS biography TEXT,
ADD COLUMN IF NOT EXISTS languages_spoken TEXT[] DEFAULT ARRAY['English'],
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT, -- Admin notes about the teacher
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}', -- Store document URLs/info
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'; -- Schedule availability

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON public.users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_employment_status ON public.users(employment_status);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);

-- Update profile completion logic to include new fields
COMMENT ON COLUMN public.users.profile_completion_status IS 'Tracks completion of teacher profile. Should be updated based on required fields.';

-- Grant necessary permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
