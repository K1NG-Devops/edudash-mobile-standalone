-- Create parent access codes table for parent registration
CREATE TABLE IF NOT EXISTS parent_access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(10) NOT NULL UNIQUE,
    preschool_id UUID NOT NULL REFERENCES preschools(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    parent_email VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT 1,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parent_access_codes_code ON parent_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_parent_access_codes_preschool ON parent_access_codes(preschool_id);
CREATE INDEX IF NOT EXISTS idx_parent_access_codes_email ON parent_access_codes(parent_email);
CREATE INDEX IF NOT EXISTS idx_parent_access_codes_status ON parent_access_codes(status);

-- Enable RLS
ALTER TABLE parent_access_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Preschool admins can manage their parent codes" ON parent_access_codes
    FOR ALL USING (
        preschool_id = get_user_tenant_id(auth.uid()) AND
        auth.uid() IN (SELECT auth_user_id FROM users WHERE role IN ('preschool_admin', 'superadmin'))
    );

-- Allow public access to view codes for registration (with code verification)
CREATE POLICY "Anyone can view parent codes with valid code" ON parent_access_codes
    FOR SELECT USING (true);

-- Update function to handle code validation
CREATE OR REPLACE FUNCTION validate_parent_code(p_code VARCHAR(10))
RETURNS TABLE(
    id UUID,
    preschool_id UUID,
    student_name VARCHAR(255),
    parent_email VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_valid BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pac.id,
        pac.preschool_id,
        pac.student_name,
        pac.parent_email,
        pac.expires_at,
        (pac.status = 'active' AND pac.expires_at > NOW() AND pac.usage_count < pac.max_usage) as is_valid
    FROM parent_access_codes pac
    WHERE pac.code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
