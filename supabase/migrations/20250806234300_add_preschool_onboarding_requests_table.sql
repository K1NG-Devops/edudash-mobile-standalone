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

-- Enable Row Level Security
ALTER TABLE preschool_onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit preschool onboarding requests (anonymous users)
DROP POLICY IF EXISTS "Anyone can submit onboarding requests" ON preschool_onboarding_requests;
CREATE POLICY "Anyone can submit onboarding requests" ON preschool_onboarding_requests
    FOR INSERT WITH CHECK (true);

-- Allow superadmins to view all onboarding requests
DROP POLICY IF EXISTS "Superadmins can view all onboarding requests" ON preschool_onboarding_requests;
CREATE POLICY "Superadmins can view all onboarding requests" ON preschool_onboarding_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Allow superadmins to update onboarding requests
DROP POLICY IF EXISTS "Superadmins can update onboarding requests" ON preschool_onboarding_requests;
CREATE POLICY "Superadmins can update onboarding requests" ON preschool_onboarding_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'superadmin'
        )
    );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_status ON preschool_onboarding_requests(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_requests_email ON preschool_onboarding_requests(admin_email);
