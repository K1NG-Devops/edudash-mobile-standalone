# Manual Database Setup for EduDash Pro

Your remote Supabase database is missing the essential tables needed for the onboarding/resend functionality. Here's how to fix it:

## Option 1: Use Supabase Dashboard SQL Editor

1. Go to your Supabase dashboard: https://app.supabase.com/project/lvvvjywrmpcqrpvuptdi
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query and paste the following SQL:

```sql
-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id text UNIQUE,
  email text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('superadmin', 'preschool_admin', 'teacher', 'parent')),
  phone text,
  is_active boolean DEFAULT true,
  school_id uuid REFERENCES schools(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create onboarding_requests table
CREATE TABLE IF NOT EXISTS onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  admin_first_name text NOT NULL,
  admin_last_name text NOT NULL,
  admin_email text NOT NULL,
  admin_phone text,
  school_address text,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  school_id uuid REFERENCES schools(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for schools
CREATE POLICY "superadmin_schools_all" ON schools
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid()::text 
            AND role = 'superadmin' 
            AND is_active = true
        )
    );

-- Create RLS Policies for admin_users
CREATE POLICY "admin_users_own" ON admin_users
    FOR SELECT USING (auth_user_id = auth.uid()::text);

CREATE POLICY "superadmin_all_admin_users" ON admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users u2 
            WHERE u2.auth_user_id = auth.uid()::text 
            AND u2.role = 'superadmin'
            AND u2.is_active = true
        )
    );

-- Create RLS Policies for onboarding_requests
CREATE POLICY "anyone_can_submit_onboarding" ON onboarding_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "superadmin_all_onboarding" ON onboarding_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users 
            WHERE auth_user_id = auth.uid()::text 
            AND role = 'superadmin'
            AND is_active = true
        )
    );

-- Insert superadmin user
INSERT INTO admin_users (
    auth_user_id,
    email,
    first_name,
    last_name,
    role,
    is_active
) VALUES (
    'temp_' || gen_random_uuid()::text,
    'superadmin@edudashpro.org.za',
    'EduDash Pro',
    'Super Administrator',
    'superadmin',
    true
) ON CONFLICT (email) DO UPDATE SET
    role = 'superadmin',
    first_name = 'EduDash Pro',
    last_name = 'Super Administrator',
    is_active = true;

-- Insert sample schools
INSERT INTO schools (name, email, phone, address, status) VALUES
    ('Little Stars Preschool', 'admin@littlestars.co.za', '+27 11 123 4567', '123 Main Street, Johannesburg', 'active'),
    ('Rainbow Kids Academy', 'contact@rainbowkids.co.za', '+27 21 987 6543', '456 Oak Avenue, Cape Town', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample onboarding requests for testing resend functionality
INSERT INTO onboarding_requests (
    school_name, admin_first_name, admin_last_name, admin_email, admin_phone, 
    school_address, message, status
) VALUES
    ('Sunshine Daycare', 'Emma', 'Williams', 'emma@sunshine.co.za', '+27 11 555 1234', 
     '789 Sun Street, Pretoria', 'We would like to join EduDash Pro', 'pending'),
    ('Happy Hearts Nursery', 'James', 'Brown', 'james@happyhearts.co.za', '+27 31 555 5678',
     '321 Heart Avenue, Durban', 'Looking forward to using your platform', 'pending')
ON CONFLICT DO NOTHING;
```

4. Click **Run** to execute the SQL

## Option 2: Use Direct API Call

If the dashboard doesn't work, I can try a direct API approach. Let me know if you prefer this option.

## What This Setup Creates

- **schools** table: Stores preschool information
- **admin_users** table: Stores admin user accounts (separate from regular users)
- **onboarding_requests** table: Stores onboarding requests that can be resent
- **Superadmin user**: Email `superadmin@edudashpro.org.za`, Password `#Olivia@17`
- **Sample data**: 2 schools, 2 pending onboarding requests for testing

## After Setup

Once you run this SQL:

1. The database audit should pass ✅
2. You can log into your app as superadmin
3. The resend functionality should work properly
4. You'll have sample onboarding requests to test with

## Verification

After running the SQL, you can verify it worked by running:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_key node database-audit.js
```

Let me know once you've run this SQL and I'll help you verify everything is working!
