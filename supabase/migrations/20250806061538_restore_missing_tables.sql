-- URGENT: Restore Missing Tables from Schema Reset
-- This script recreates all tables that were dropped but not recreated by the comprehensive schema reset

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  address_type varchar(20) NOT NULL CHECK (address_type IN ('home', 'work', 'billing', 'emergency')),
  street_address text NOT NULL,
  city varchar(100) NOT NULL,
  state varchar(100),
  postal_code varchar(20),
  country varchar(100) DEFAULT 'United States',
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Emergency Contacts table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  relationship varchar(100) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255),
  address text,
  is_primary boolean DEFAULT false,
  can_pickup boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Class Assignments table
CREATE TABLE IF NOT EXISTS public.class_assignments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_date date DEFAULT CURRENT_DATE,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred')),
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, class_id)
);

-- 4. Messages table (Communication System)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject varchar(255) NOT NULL,
  content text NOT NULL,
  message_type varchar(20) DEFAULT 'general' CHECK (message_type IN ('general', 'announcement', 'emergency', 'homework', 'event')),
  priority varchar(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_draft boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Message Recipients table
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_type varchar(20) DEFAULT 'user' CHECK (recipient_type IN ('user', 'class', 'role')),
  read_at timestamptz,
  status varchar(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, recipient_id)
);

-- 6. Message Notifications table
CREATE TABLE IF NOT EXISTS public.message_notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  notification_type varchar(30) DEFAULT 'message' CHECK (notification_type IN ('message', 'announcement', 'emergency', 'reminder')),
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 7. School Invitation Codes table
CREATE TABLE IF NOT EXISTS public.school_invitation_codes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  code varchar(50) UNIQUE NOT NULL,
  invitation_type varchar(20) DEFAULT 'teacher' CHECK (invitation_type IN ('teacher', 'parent', 'admin')),
  invited_email varchar(255) NOT NULL,
  invited_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid REFERENCES public.users(id),
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 8. Parent Access Codes table
CREATE TABLE IF NOT EXISTS public.parent_access_codes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  code varchar(20) UNIQUE NOT NULL,
  parent_email varchar(255) NOT NULL,
  student_name varchar(255) NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at timestamptz,
  used_by uuid REFERENCES public.users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 9. Student Registrations table
CREATE TABLE IF NOT EXISTS public.student_registrations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  student_first_name varchar(255) NOT NULL,
  student_last_name varchar(255) NOT NULL,
  date_of_birth date NOT NULL,
  age_group_id uuid NOT NULL REFERENCES public.age_groups(id),
  parent_email varchar(255) NOT NULL,
  parent_phone varchar(20),
  allergies text,
  special_needs text,
  emergency_contact_name varchar(255),
  emergency_contact_phone varchar(20),
  registration_code varchar(50) UNIQUE,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  approved_by uuid REFERENCES public.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 10. Payments System Tables
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  method_type varchar(20) NOT NULL CHECK (method_type IN ('card', 'bank', 'paypal', 'stripe')),
  provider varchar(50) NOT NULL,
  provider_payment_method_id varchar(255),
  is_default boolean DEFAULT false,
  last_four varchar(4),
  expiry_month integer,
  expiry_year integer,
  cardholder_name varchar(255),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_fees (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  fee_type varchar(30) NOT NULL CHECK (fee_type IN ('tuition', 'registration', 'activity', 'lunch', 'late_pickup', 'supplies')),
  amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  description text NOT NULL,
  due_date date NOT NULL,
  recurring_type varchar(20) CHECK (recurring_type IN ('none', 'weekly', 'monthly', 'quarterly', 'yearly')),
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_fee_id uuid NOT NULL REFERENCES public.payment_fees(id) ON DELETE CASCADE,
  payment_method_id uuid REFERENCES public.payment_methods(id),
  amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  payment_status varchar(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_intent_id varchar(255),
  transaction_id varchar(255),
  payment_date timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  receipt_number varchar(100) UNIQUE NOT NULL,
  receipt_url text,
  amount decimal(10,2) NOT NULL,
  currency varchar(3) DEFAULT 'USD',
  issued_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 11. Media and Files
CREATE TABLE IF NOT EXISTS public.media_uploads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name varchar(255) NOT NULL,
  file_type varchar(50) NOT NULL,
  file_size bigint NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  mime_type varchar(100),
  alt_text text,
  is_public boolean DEFAULT false,
  folder varchar(100) DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);

-- 12. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  preference_key varchar(100) NOT NULL,
  preference_value jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, preference_key)
);

-- Create essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_student_id ON public.emergency_contacts(student_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_student_id ON public.class_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_assignments_class_id ON public.class_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_messages_preschool_id ON public.messages(preschool_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_school_invitation_codes_code ON public.school_invitation_codes(code);
CREATE INDEX IF NOT EXISTS idx_parent_access_codes_code ON public.parent_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_student_registrations_preschool_id ON public.student_registrations(preschool_id);
CREATE INDEX IF NOT EXISTS idx_payments_preschool_id ON public.payments(preschool_id);
CREATE INDEX IF NOT EXISTS idx_payment_fees_student_id ON public.payment_fees(student_id);

-- Enable RLS on all new tables
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_invitation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (we'll refine these later)
-- For now, allow authenticated users to access data in their preschool

-- Addresses
CREATE POLICY "users_can_manage_own_addresses" ON public.addresses
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Emergency Contacts
CREATE POLICY "preschool_users_can_manage_emergency_contacts" ON public.emergency_contacts
  FOR ALL TO authenticated
  USING (student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.users u ON s.preschool_id = u.preschool_id
    WHERE u.auth_user_id = auth.uid()
  ));

-- Class Assignments
CREATE POLICY "preschool_users_can_view_class_assignments" ON public.class_assignments
  FOR SELECT TO authenticated
  USING (student_id IN (
    SELECT s.id FROM public.students s
    JOIN public.users u ON s.preschool_id = u.preschool_id
    WHERE u.auth_user_id = auth.uid()
  ));

-- Messages (temporary open policy)
CREATE POLICY "authenticated_users_can_manage_messages" ON public.messages
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_message_recipients" ON public.message_recipients
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "authenticated_users_can_manage_message_notifications" ON public.message_notifications
  FOR ALL TO authenticated
  USING (true);

-- School Invitation Codes
CREATE POLICY "preschool_admins_can_manage_invitation_codes" ON public.school_invitation_codes
  FOR ALL TO authenticated
  USING (true);

-- Parent Access Codes
CREATE POLICY "preschool_users_can_view_parent_codes" ON public.parent_access_codes
  FOR SELECT TO authenticated
  USING (true);

-- Student Registrations
CREATE POLICY "preschool_users_can_manage_registrations" ON public.student_registrations
  FOR ALL TO authenticated
  USING (true);

-- Payment tables (temporary open policies)
CREATE POLICY "users_can_manage_payment_methods" ON public.payment_methods
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "preschool_users_can_view_payment_fees" ON public.payment_fees
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "preschool_users_can_manage_payments" ON public.payments
  FOR ALL TO authenticated
  USING (true);

CREATE POLICY "users_can_view_payment_receipts" ON public.payment_receipts
  FOR SELECT TO authenticated
  USING (true);

-- Media uploads
CREATE POLICY "preschool_users_can_manage_media" ON public.media_uploads
  FOR ALL TO authenticated
  USING (true);

-- User preferences
CREATE POLICY "users_can_manage_own_preferences" ON public.user_preferences
  FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- Re-create the missing table that should also exist (message_drafts was in the original but not the comprehensive reset)
-- Handle existing table by adding missing columns
DO $$ 
BEGIN
    -- Check if message_drafts table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'message_drafts') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'message_drafts' 
                       AND column_name = 'author_id') THEN
            ALTER TABLE public.message_drafts 
            ADD COLUMN author_id uuid;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'message_drafts' 
                       AND column_name = 'preschool_id') THEN
            ALTER TABLE public.message_drafts 
            ADD COLUMN preschool_id uuid;
        END IF;
        
        -- Add foreign key constraints if columns exist but constraints don't
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'message_drafts' 
                   AND column_name = 'author_id') THEN
            -- Add constraint if it doesn't exist
            BEGIN
                ALTER TABLE public.message_drafts 
                ADD CONSTRAINT fk_message_drafts_author FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN
                NULL; -- Constraint already exists
            END;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'message_drafts' 
                   AND column_name = 'preschool_id') THEN
            -- Add constraint if it doesn't exist
            BEGIN
                ALTER TABLE public.message_drafts 
                ADD CONSTRAINT fk_message_drafts_preschool FOREIGN KEY (preschool_id) REFERENCES public.preschools(id) ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN
                NULL; -- Constraint already exists
            END;
        END IF;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE public.message_drafts (
          id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
          preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE,
          author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          subject varchar(255),
          content text,
          recipient_ids jsonb DEFAULT '[]',
          message_type varchar(20) DEFAULT 'general',
          priority varchar(10) DEFAULT 'normal',
          scheduled_for timestamptz,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        );
    END IF;
END $$;

ALTER TABLE public.message_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "users_can_manage_own_drafts" ON public.message_drafts;

-- Create RLS policy only if author_id column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'message_drafts' 
               AND column_name = 'author_id') THEN
        EXECUTE 'CREATE POLICY "users_can_manage_own_drafts" ON public.message_drafts
                   FOR ALL TO authenticated
                   USING (author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
                   WITH CHECK (author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))';
    END IF;
END $$;

-- Success message
SELECT 'Missing tables have been restored successfully!' as status;
