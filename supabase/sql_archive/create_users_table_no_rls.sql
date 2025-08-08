-- Clean users table creation script (NO RLS)
-- Run this in Supabase SQL Editor

-- 1. Drop the users table completely if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create the users table with clean structure
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'preschool_admin', 'teacher', 'parent')),
    preschool_id UUID,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    auth_user_id UUID,
    
    -- Address information
    home_address TEXT,
    home_city TEXT,
    home_postal_code TEXT,
    
    -- Work information
    work_company TEXT,
    work_position TEXT,
    work_address TEXT,
    work_phone TEXT,
    
    -- Emergency contacts
    emergency_contact_1_name TEXT,
    emergency_contact_1_phone TEXT,
    emergency_contact_1_relationship TEXT,
    emergency_contact_2_name TEXT,
    emergency_contact_2_phone TEXT,
    emergency_contact_2_relationship TEXT,
    
    -- Additional parent information
    relationship_to_child TEXT,
    pickup_authorized TEXT,
    
    -- Profile completion tracking
    profile_completed_at TIMESTAMPTZ,
    profile_completion_status TEXT DEFAULT 'incomplete' CHECK (profile_completion_status IN ('incomplete', 'in_progress', 'complete')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_preschool_id ON public.users(preschool_id);

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Grant permissions (open access since no RLS)
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- 6. Insert the superadmin user
INSERT INTO public.users (
    email,
    name,
    role,
    auth_user_id,
    is_active,
    profile_completion_status
) VALUES (
    'superadmin@edudashpro.org.za',
    'Super Admin',
    'superadmin',
    'e8a14d78-d21b-4932-aae8-d2b7f4e25159',
    true,
    'complete'
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    auth_user_id = EXCLUDED.auth_user_id,
    is_active = EXCLUDED.is_active,
    profile_completion_status = EXCLUDED.profile_completion_status,
    updated_at = NOW();

-- 7. Verify the user was created
SELECT 
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    created_at
FROM public.users 
WHERE email = 'superadmin@edudashpro.org.za';
