-- Migration to create payment system tables for EduDash
-- This enables the full payment workflow with Supabase integration

-- Table: Payment Fees
CREATE TABLE IF NOT EXISTS public.payment_fees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_type text CHECK (fee_type IN ('tuition', 'activity', 'meal', 'transport', 'material', 'late_fee', 'registration', 'other')) NOT NULL,
  title text NOT NULL,
  description text,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'ZAR' NOT NULL,
  due_date date NOT NULL,
  is_recurring boolean DEFAULT false,
  recurring_frequency text CHECK (recurring_frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  is_overdue boolean GENERATED ALWAYS AS (due_date < CURRENT_DATE AND NOT is_paid) STORED,
  is_paid boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Payment Methods Configuration
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  method_type text CHECK (method_type IN ('card', 'bank_transfer', 'payfast', 'stripe', 'manual')) NOT NULL,
  display_name text NOT NULL,
  is_enabled boolean DEFAULT true,
  is_default boolean DEFAULT false,
  provider_config jsonb DEFAULT '{}', -- Store API keys, merchant IDs, etc.
  transaction_fee_percentage decimal(5,4) DEFAULT 0,
  transaction_fee_fixed decimal(10,2) DEFAULT 0,
  minimum_amount decimal(10,2) DEFAULT 0,
  maximum_amount decimal(10,2),
  supported_currencies text[] DEFAULT ARRAY['ZAR'],
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(preschool_id, method_type)
);

-- Table: Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  fee_ids uuid[] NOT NULL, -- Array of payment_fees.id
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'ZAR' NOT NULL,
  payment_method text NOT NULL,
  payment_reference text NOT NULL UNIQUE,
  provider_transaction_id text, -- External payment provider ID
  status text CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')) DEFAULT 'pending',
  failure_reason text,
  description text,
  metadata jsonb DEFAULT '{}', -- Store additional payment info
  transaction_fee decimal(10,2) DEFAULT 0,
  net_amount decimal(10,2) GENERATED ALWAYS AS (amount - transaction_fee) STORED,
  processed_at timestamptz,
  refunded_at timestamptz,
  refund_amount decimal(10,2),
  refund_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Payment Receipts
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  receipt_number text NOT NULL UNIQUE,
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'ZAR' NOT NULL,
  fees_breakdown jsonb NOT NULL, -- Array of fee details
  payment_date timestamptz NOT NULL,
  payment_method text NOT NULL,
  receipt_data jsonb NOT NULL, -- Formatted receipt information
  pdf_url text, -- Generated PDF receipt URL
  email_sent boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: Payment Notifications
CREATE TABLE IF NOT EXISTS public.payment_notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  notification_type text CHECK (notification_type IN ('payment_due', 'payment_overdue', 'payment_successful', 'payment_failed', 'receipt_ready')) NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  is_sent boolean DEFAULT false,
  sent_via text[] DEFAULT ARRAY['in_app'], -- 'in_app', 'email', 'sms', 'push'
  sent_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create necessary indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_fees_student_id ON public.payment_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_fees_preschool_id ON public.payment_fees(preschool_id);
CREATE INDEX IF NOT EXISTS idx_payment_fees_due_date ON public.payment_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_fees_is_paid ON public.payment_fees(is_paid);
CREATE INDEX IF NOT EXISTS idx_payment_fees_overdue ON public.payment_fees(is_overdue) WHERE is_overdue = true;

CREATE INDEX IF NOT EXISTS idx_payments_parent_id ON public.payments(parent_id);
CREATE INDEX IF NOT EXISTS idx_payments_preschool_id ON public.payments(preschool_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment_id ON public.payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON public.payment_receipts(receipt_number);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_recipient ON public.payment_notifications(recipient_id, is_read);

-- Enable Row Level Security
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Payment Fees: Users can only see fees for their preschool and their students
CREATE POLICY "payment_fees_policy" ON public.payment_fees
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (
      -- Teachers and admins can see all fees in their preschool
      (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'principal', 'teacher')
      OR
      -- Parents can only see fees for their children
      (
        (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'parent'
        AND student_id IN (
          SELECT s.id FROM public.students s 
          WHERE s.parent_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
      )
    )
  );

-- Payment Methods: Users can only see methods for their preschool
CREATE POLICY "payment_methods_policy" ON public.payment_methods
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Payments: Users can only see payments for their preschool and their role
CREATE POLICY "payments_policy" ON public.payments
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (
      -- Teachers and admins can see all payments in their preschool
      (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'principal', 'teacher')
      OR
      -- Parents can only see their own payments
      (
        (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'parent'
        AND parent_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
      )
    )
  );

-- Payment Receipts: Same as payments
CREATE POLICY "payment_receipts_policy" ON public.payment_receipts
  USING (
    preschool_id = (SELECT preschool_id FROM public.users WHERE auth_user_id = auth.uid())
    AND (
      -- Teachers and admins can see all receipts in their preschool
      (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'principal', 'teacher')
      OR
      -- Parents can only see receipts for their payments
      (
        (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'parent'
        AND payment_id IN (
          SELECT p.id FROM public.payments p 
          WHERE p.parent_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
        )
      )
    )
  );

-- Payment Notifications: Users can only see their own notifications
CREATE POLICY "payment_notifications_policy" ON public.payment_notifications
  USING (
    recipient_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Functions for automatic fee generation and payment processing
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS text AS $$
BEGIN
  RETURN 'EDU' || EXTRACT(YEAR FROM NOW()) || LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || 
         LPAD(EXTRACT(HOUR FROM NOW())::text, 2, '0') || LPAD(EXTRACT(MINUTE FROM NOW())::text, 2, '0') ||
         UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 4));
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status and related fees
CREATE OR REPLACE FUNCTION update_payment_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- When payment status changes to 'completed', mark associated fees as paid
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.payment_fees 
    SET is_paid = true, 
        paid_at = NEW.processed_at,
        updated_at = now()
    WHERE id = ANY(NEW.fee_ids);
    
    -- Set processed_at if not already set
    IF NEW.processed_at IS NULL THEN
      NEW.processed_at = now();
    END IF;
  END IF;
  
  -- When payment is refunded, mark fees as unpaid
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    UPDATE public.payment_fees 
    SET is_paid = false, 
        paid_at = NULL,
        updated_at = now()
    WHERE id = ANY(NEW.fee_ids);
    
    NEW.refunded_at = now();
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment completion
CREATE TRIGGER payment_completion_trigger
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_completion();

-- Function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_payment_fees_updated_at BEFORE UPDATE ON public.payment_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_receipts_updated_at BEFORE UPDATE ON public.payment_receipts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods for all existing preschools
INSERT INTO public.payment_methods (preschool_id, method_type, display_name, is_enabled, is_default, sort_order)
SELECT 
  p.id,
  'card',
  'Credit/Debit Card',
  true,
  true,
  1
FROM public.preschools p
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm 
  WHERE pm.preschool_id = p.id AND pm.method_type = 'card'
);

INSERT INTO public.payment_methods (preschool_id, method_type, display_name, is_enabled, is_default, sort_order)
SELECT 
  p.id,
  'bank_transfer',
  'Bank Transfer',
  true,
  false,
  2
FROM public.preschools p
WHERE NOT EXISTS (
  SELECT 1 FROM public.payment_methods pm 
  WHERE pm.preschool_id = p.id AND pm.method_type = 'bank_transfer'
);

-- Add sample payment fees for testing (optional - remove in production)
-- INSERT INTO public.payment_fees (preschool_id, student_id, fee_type, title, description, amount, due_date)
-- SELECT 
--   s.preschool_id,
--   s.id,
--   'tuition',
--   'January 2025 Tuition',
--   'Monthly tuition fee for preschool education',
--   1200.00,
--   '2025-01-15'
-- FROM public.students s
-- WHERE s.is_active = true
-- LIMIT 5;
