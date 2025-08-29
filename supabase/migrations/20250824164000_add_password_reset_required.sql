-- Add password_reset_required column to users table
-- This will be used to redirect users with temporary passwords to reset their password

ALTER TABLE users 
ADD COLUMN password_reset_required BOOLEAN DEFAULT FALSE;

-- Add comment to explain the column
COMMENT ON COLUMN users.password_reset_required IS 'Flag to indicate if user needs to reset their password after first login with temporary password';

-- Create index for better performance when querying users who need password reset
CREATE INDEX idx_users_password_reset_required ON users(password_reset_required) WHERE password_reset_required = true;

-- Update existing users to not require password reset (they already have proper passwords)
UPDATE users SET password_reset_required = FALSE WHERE password_reset_required IS NULL;
