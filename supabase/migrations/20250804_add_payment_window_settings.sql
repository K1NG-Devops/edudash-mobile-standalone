-- Add payment window settings to users table
-- These allow parents to set custom payment window dates (1-7 by default)

ALTER TABLE public.users 
ADD COLUMN payment_window_start INTEGER DEFAULT 1 CHECK (payment_window_start >= 1 AND payment_window_start <= 31),
ADD COLUMN payment_window_end INTEGER DEFAULT 7 CHECK (payment_window_end >= 1 AND payment_window_end <= 31),
ADD COLUMN payment_window_locked BOOLEAN DEFAULT false;

-- Add a comment to explain the feature
COMMENT ON COLUMN public.users.payment_window_start IS 'Day of the month when payment window starts (1-31)';
COMMENT ON COLUMN public.users.payment_window_end IS 'Day of the month when payment window ends (1-31)';
COMMENT ON COLUMN public.users.payment_window_locked IS 'Whether the payment window is locked and can only be changed by admin';

-- Add constraint to ensure end_day is after start_day (or allow wraparound for month-end cases)
ALTER TABLE public.users 
ADD CONSTRAINT check_payment_window_range 
CHECK (
  payment_window_start IS NULL 
  OR payment_window_end IS NULL 
  OR payment_window_start <= payment_window_end
  OR (payment_window_start > 25 AND payment_window_end <= 7) -- Allow wraparound (e.g., 28th to 7th)
);
