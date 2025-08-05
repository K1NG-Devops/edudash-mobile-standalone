export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded' | 'proof_submitted';

export type FeeType = 'tuition' | 'activity' | 'meal' | 'transport' | 'late_fee' | 'registration' | 'material' | 'other';

export type PaymentMethod = 'card' | 'bank_transfer' | 'cash' | 'eft' | 'payfast' | 'stripe';

export interface PaymentFee {
  id: string;
  preschool_id: string;
  student_id: string;
  fee_type: FeeType;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  due_date: string;
  is_recurring: boolean;
  recurring_frequency?: 'monthly' | 'quarterly' | 'annually';
  is_overdue: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  student?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface Payment {
  id: string;
  preschool_id: string;
  parent_id: string;
  student_id?: string;
  fee_ids: string[]; // Array of fee IDs being paid
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  payment_reference: string;
  payment_provider_id?: string; // Stripe payment intent ID, PayFast payment ID, etc.
  status: PaymentStatus;
  description?: string;
  receipt_url?: string;
  failure_reason?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  parent?: {
    id: string;
    name: string;
    email: string;
  };
  student?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  fees?: PaymentFee[];
}

export interface PaymentMethod_Config {
  id: string;
  preschool_id: string;
  method_type: PaymentMethod;
  is_enabled: boolean;
  display_name: string;
  description?: string;
  config: {
    // For Stripe
    stripe_publishable_key?: string;
    stripe_webhook_secret?: string;
    
    // For PayFast
    payfast_merchant_id?: string;
    payfast_merchant_key?: string;
    payfast_passphrase?: string;
    
    // For Bank Transfer
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
    branch_code?: string;
    reference_format?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PaymentReceipt {
  id: string;
  payment_id: string;
  preschool_id: string;
  receipt_number: string;
  amount: number;
  currency: string;
  fees_breakdown: {
    fee_id: string;
    fee_title: string;
    amount: number;
  }[];
  payment_date: string;
  payment_method: PaymentMethod;
  receipt_data: {
    parent_name: string;
    parent_email: string;
    student_name?: string;
    preschool_name: string;
    preschool_address?: string;
    payment_reference: string;
  };
  pdf_url?: string;
  created_at: string;
}

export interface PaymentSummary {
  total_outstanding: number;
  total_paid_this_month: number;
  next_payment_due: string | null;
  overdue_amount: number;
  upcoming_fees: PaymentFee[];
  recent_payments: Payment[];
}

// Component Props Types
export interface PaymentCardProps {
  fee: PaymentFee;
  onPayPress: (fee: PaymentFee) => void;
  showStudentName?: boolean;
}

export interface PaymentMethodSelectorProps {
  methods: PaymentMethod_Config[];
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  loading?: boolean;
  onRefresh?: () => void;
  onPaymentPress?: (payment: Payment) => void;
}

export interface PaymentProcessorProps {
  fees: PaymentFee[];
  paymentMethod: PaymentMethod;
  onSuccess: (payment: Payment) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

// Payment form data
export interface PaymentFormData {
  selectedFees: string[];
  paymentMethod: PaymentMethod;
  totalAmount: number;
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  paymentMethodDetails?: {
    // Card details
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    
    // Bank transfer details
    reference?: string;
    proofOfPayment?: string; // File URL
  };
}

// API Response types
export interface PaymentApiResponse {
  success: boolean;
  payment?: Payment;
  error?: string;
  redirect_url?: string; // For payment gateways
}

export interface FeesApiResponse {
  success: boolean;
  fees?: PaymentFee[];
  summary?: PaymentSummary;
  error?: string;
}
