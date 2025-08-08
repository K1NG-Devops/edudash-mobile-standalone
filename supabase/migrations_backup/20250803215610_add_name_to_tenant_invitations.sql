-- Add missing name column to tenant_invitations table
-- This column is needed for storing the invited user's name

ALTER TABLE public.tenant_invitations 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add comment to document the column
COMMENT ON COLUMN public.tenant_invitations.name IS 'Name of the person being invited';
