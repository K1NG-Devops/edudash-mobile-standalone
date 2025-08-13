-- Enhanced users table with automatic profile creation
-- Run this in Supabase SQL Editor

-- 1. Drop the users table completely if it exists
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. Create the users table with clean structure (NO RLS)
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('superadmin', 'preschool_admin', 'teacher', 'parent')),
    preschool_id UUID,
    avatar_url TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    auth_user_id UUID UNIQUE NOT NULL, -- Must be unique and not null
    
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

-- 5. Create automatic profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    auth_user_id,
    email,
    name,
    role,
    is_active,
    profile_completion_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    true,
    'incomplete'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant permissions (open access since no RLS)
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- 8. Insert the superadmin user
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
    '30ed3b16-6ce6-4083-95e6-99ca13046404',
    true,
    'complete'
) ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    auth_user_id = EXCLUDED.auth_user_id,
    is_active = EXCLUDED.is_active,
    profile_completion_status = EXCLUDED.profile_completion_status,
    updated_at = NOW();

-- 9. Create a function to get current user profile
CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    role TEXT,
    preschool_id UUID,
    auth_user_id UUID,
    is_active BOOLEAN,
    avatar_url TEXT,
    phone TEXT,
    profile_completion_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.preschool_id,
    u.auth_user_id,
    u.is_active,
    u.avatar_url,
    u.phone,
    u.profile_completion_status,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO anon;

-- 11. Verify the superadmin user was created
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
