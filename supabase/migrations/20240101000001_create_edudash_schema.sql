-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create preschools table
CREATE TABLE IF NOT EXISTS preschools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    subscription_plan VARCHAR(20) DEFAULT 'trial' CHECK (subscription_plan IN ('trial', 'basic', 'premium')),
    subscription_status VARCHAR(20) DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'inactive', 'cancelled')),
    max_students INTEGER DEFAULT 50,
    max_teachers INTEGER DEFAULT 10,
    onboarding_status VARCHAR(20) DEFAULT 'requested' CHECK (onboarding_status IN ('requested', 'approved', 'setup', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('superadmin', 'preschool_admin', 'teacher', 'parent')),
    preschool_id UUID REFERENCES preschools(id) ON DELETE CASCADE,
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    auth_user_id UUID REFERENCES auth.users(id), -- Link to Supabase auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create age_groups table
CREATE TABLE IF NOT EXISTS age_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    min_age INTEGER NOT NULL,
    max_age INTEGER NOT NULL,
    description TEXT
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    teacher_id UUID REFERENCES users(id),
    max_capacity INTEGER DEFAULT 15,
    current_enrollment INTEGER DEFAULT 0,
    room_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    parent_id UUID REFERENCES users(id),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    allergies TEXT,
    special_needs TEXT,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lesson_categories table
CREATE TABLE IF NOT EXISTS lesson_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7)
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    category_id UUID NOT NULL REFERENCES lesson_categories(id),
    age_group_id UUID NOT NULL REFERENCES age_groups(id),
    duration_minutes INTEGER DEFAULT 30,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    materials_needed TEXT,
    learning_objectives TEXT,
    is_public BOOLEAN DEFAULT false,
    preschool_id UUID REFERENCES preschools(id),
    created_by UUID REFERENCES users(id),
    thumbnail_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL,
    instructions TEXT,
    estimated_time INTEGER,
    materials TEXT,
    sequence_order INTEGER DEFAULT 1
);

-- Create preschool_onboarding_requests table
CREATE TABLE IF NOT EXISTS preschool_onboarding_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preschool_name VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    number_of_students INTEGER,
    number_of_teachers INTEGER,
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_preschool_id ON users(preschool_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_students_preschool_id ON students(preschool_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_category_age ON lessons(category_id, age_group_id);
CREATE INDEX IF NOT EXISTS idx_lessons_public ON lessons(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_classes_preschool_id ON classes(preschool_id);

-- Enable Row Level Security (RLS)
ALTER TABLE preschools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE preschool_onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (Drop existing ones first to avoid conflicts)

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own preschool" ON preschools;
DROP POLICY IF EXISTS "Users can view users from their preschool" ON users;
DROP POLICY IF EXISTS "Users can view students from their preschool" ON students;
DROP POLICY IF EXISTS "Users can view classes from their preschool" ON classes;
DROP POLICY IF EXISTS "Anyone can view public lessons" ON lessons;
DROP POLICY IF EXISTS "Users can view lessons from their preschool" ON lessons;
DROP POLICY IF EXISTS "Users can view activities for accessible lessons" ON activities;
DROP POLICY IF EXISTS "Age groups are viewable by everyone" ON age_groups;
DROP POLICY IF EXISTS "Lesson categories are viewable by everyone" ON lesson_categories;

-- Preschools: Users can only see their own preschool
CREATE POLICY "Users can view their own preschool" ON preschools
    FOR SELECT USING (auth.uid() IN (
        SELECT auth_user_id FROM users WHERE preschool_id = preschools.id
    ));

-- Users: Users can see users from their preschool (bypass RLS for superadmin)
CREATE POLICY "Users can view users from their preschool" ON users
    FOR SELECT USING (
        auth.uid() = auth_user_id OR
        role = 'superadmin' OR
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.auth_user_id = auth.uid() 
            AND (u.role = 'superadmin' OR u.preschool_id = users.preschool_id)
        )
    );

-- Students: Users can see students from their preschool
CREATE POLICY "Users can view students from their preschool" ON students
    FOR SELECT USING (
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Classes: Users can see classes from their preschool
CREATE POLICY "Users can view classes from their preschool" ON classes
    FOR SELECT USING (
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Lessons: Public lessons viewable by all, private lessons by preschool
CREATE POLICY "Anyone can view public lessons" ON lessons
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view lessons from their preschool" ON lessons
    FOR SELECT USING (
        is_public = true OR
        preschool_id IN (
            SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- Activities: Viewable if user can see the lesson
CREATE POLICY "Users can view activities for accessible lessons" ON activities
    FOR SELECT USING (
        lesson_id IN (
            SELECT id FROM lessons WHERE 
            is_public = true OR 
            preschool_id IN (
                SELECT preschool_id FROM users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- Age groups and lesson categories are public
ALTER TABLE age_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Age groups are viewable by everyone" ON age_groups FOR SELECT USING (true);
CREATE POLICY "Lesson categories are viewable by everyone" ON lesson_categories FOR SELECT USING (true);
