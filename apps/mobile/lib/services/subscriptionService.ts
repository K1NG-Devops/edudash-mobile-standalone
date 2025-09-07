import { supabase } from '../supabase';
import { createLogger } from '@/lib/utils/logger';
import * as Crypto from 'expo-crypto';

const log = createLogger('subscription');

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type PlanTier = 'free' | 'starter' | 'basic' | 'premium' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'paused' | 'expired';
export type BillingInterval = 'monthly' | 'annual';
export type PaymentProvider = 'paypal' | 'stripe' | 'payfast';

export interface SubscriptionPlan {
  id: string;
  name: string;
  tier: PlanTier;
  price_monthly: number;
  price_annual: number;
  currency: string;
  features: string[];
  limits: {
    students: number | null; // null = unlimited
    ai_lessons_per_month: number | null;
    ai_tutors: number | null;
    schools: number | null;
    storage_gb: number | null;
  };
  trial_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_interval: BillingInterval;
  amount: number;
  currency: string;
  trial_start?: string | null;
  trial_end?: string | null;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string | null;
  ended_at?: string | null;
  payment_provider: PaymentProvider;
  provider_subscription_id?: string | null;
  provider_customer_id?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Optional joined plan info when selected with plan:subscription_plans(*)
  plan?: { name?: string | null; tier?: PlanTier | null } | null;
}

export interface PayPalSubscriptionResponse {
  id: string;
  status: string;
  status_update_time: string;
  plan_id: string;
  start_time: string;
  quantity: string;
  shipping_amount: {
    currency_code: string;
    value: string;
  };
  subscriber: {
    name: {
      given_name: string;
      surname: string;
    };
    email_address: string;
    payer_id: string;
  };
  billing_info: {
    outstanding_balance: {
      currency_code: string;
      value: string;
    };
    cycle_executions: Array<{
      tenure_type: string;
      sequence: number;
      cycles_completed: number;
      cycles_remaining: number;
      current_pricing_scheme_version: number;
    }>;
    last_payment?: {
      amount: {
        currency_code: string;
        value: string;
      };
      time: string;
    };
    next_billing_time: string;
    failed_payments_count: number;
  };
  create_time: string;
  update_time: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface SubscriptionAnalytics {
  total_subscribers: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  canceled_subscriptions: number;
  monthly_recurring_revenue: number;
  annual_recurring_revenue: number;
  average_revenue_per_user: number;
  churn_rate: number;
  growth_rate: number;
  conversion_rate: number;
  revenue_by_plan: Record<PlanTier, number>;
  subscriber_breakdown: Record<PlanTier, number>;
  recent_transactions: Array<{
    id: string;
    user_email: string;
    plan_name: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
}

export interface CreateSubscriptionRequest {
  user_id: string;
  plan_id: string;
  billing_interval: BillingInterval;
  payment_provider: PaymentProvider;
  provider_customer_id?: string;
  metadata?: Record<string, any>;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource_type: string;
  summary: string;
  resource: any;
  create_time: string;
  event_version: string;
  resource_version: string;
}

export interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: 'COMPLETE' | 'FAILED' | 'PENDING';
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  token: string;
  billing_date: string;
  signature: string;
}

export interface PayFastSubscriptionData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description: string;
  subscription_type: '1' | '2'; // 1 = Regular subscription, 2 = Ad hoc subscription
  billing_date: string;
  recurring_amount: string;
  frequency: '3' | '4' | '5' | '6'; // 3 = Monthly, 4 = Quarterly, 5 = Biannually, 6 = Annual
  cycles: string; // 0 = Until cancelled
  passphrase?: string;
  signature?: string;
}

// =====================================================
// SUBSCRIPTION SERVICE CLASS
// =====================================================

export class SubscriptionService {
  // Server-only credentials helpers. Do NOT expose secrets in client bundles.
  private static getPayPalCreds() {
    return {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    } as { clientId?: string; clientSecret?: string };
  }

  private static getPaypalBaseUrl() {
    return (process.env.EXPO_PUBLIC_PAYPAL_ENV === 'production')
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private static getPayfastConfig() {
    return {
      merchantId: process.env.PAYFAST_MERCHANT_ID,
      merchantKey: process.env.PAYFAST_MERCHANT_KEY,
      passphrase: process.env.PAYFAST_PASSPHRASE,
    } as { merchantId?: string; merchantKey?: string; passphrase?: string };
  }

  private static getPayfastBaseUrl() {
    return (process.env.EXPO_PUBLIC_PAYFAST_ENV === 'production')
      ? 'https://www.payfast.co.za/eng/process'
      : 'https://sandbox.payfast.co.za/eng/process';
  }

  private static getPayfastValidateUrl() {
    return (process.env.EXPO_PUBLIC_PAYFAST_ENV === 'production')
      ? 'https://www.payfast.co.za/eng/query/validate'
      : 'https://sandbox.payfast.co.za/eng/query/validate';
  }

  // Promotional pricing rules
  // Note: These are applied dynamically at subscription creation time and do not
  // mutate DB plan definitions. DB remains the source of truth for non-promo pricing.
  private static promoRules: Record<string, {
    limit: number;            // Maximum number of subscribers eligible
    monthly: number;          // Promotional monthly price
    annualMultiplier?: number; // Optional multiplier for annual discount (e.g., 0.83 for ~17% off)
    enabled: boolean;
  }> = {
    'quantum-pro': {
      limit: 100,
      monthly: 149.99,
      annualMultiplier: 0.83,
      enabled: true,
    },
  };

  // =====================================================
  // SUBSCRIPTION PLANS MANAGEMENT
  // =====================================================

  /**
   * Map a DB row to the app's SubscriptionPlan shape
   * DB schema (subscription_plans): id(uuid), name(text), price_monthly(numeric), price_annual(numeric),
   * features(jsonb), ai_quota_monthly(int), max_students(int), max_teachers(int), is_active(bool), created_at(ts)
   */
  private static mapDBPlanToSubscriptionPlan(db: any): SubscriptionPlan {
    const name: string = db.name || '';
    const lower = name.toLowerCase();

    // Prefer DB tier if present; otherwise derive from name
    let derivedTier: PlanTier = 'free';
    if (lower.includes('neural')) derivedTier = 'starter';
    else if (lower.includes('quantum')) derivedTier = 'premium';
    else if (lower.includes('singularity') || lower.includes('enterprise')) derivedTier = 'enterprise';

    const tier: PlanTier = (db.tier as PlanTier) || derivedTier;

    const price_monthly = typeof db.price_monthly === 'string' ? parseFloat(db.price_monthly) : (db.price_monthly ?? 0);
    const price_annual = typeof db.price_annual === 'string' ? parseFloat(db.price_annual) : (db.price_annual ?? 0);

    // Derive limits from existing columns
    const ai_quota_monthly: number | null = db.ai_quota_monthly ?? null;

    const limits = {
      students: db.max_students ?? null,
      ai_lessons_per_month: ai_quota_monthly,
      ai_tutors: null as number | null,
      schools: tier === 'enterprise' ? null : 1,
      storage_gb: null as number | null,
    };

    return {
      // Use DB UUID as the plan id to maintain FK integrity
      id: String(db.id),
      name,
      tier,
      price_monthly,
      price_annual,
      currency: db.currency || 'ZAR',
      features: Array.isArray(db.features) ? db.features : (db.features ? db.features : []),
      limits,
      // Trial defaults: match product expectations but allow override later if added to schema
      trial_days: tier === 'starter' || tier === 'premium' ? 14 : tier === 'enterprise' ? 30 : 0,
      is_active: !!db.is_active,
      created_at: db.created_at || new Date().toISOString(),
      updated_at: db.updated_at || db.created_at || new Date().toISOString(),
    };
  }

  /**
   * Resolve effective pricing for a plan, applying promotional rules when eligible.
   * This does not mutate the plan; it returns the effective price to charge.
   */
  static async getEffectivePricing(
    planIdentifier: string,
    billingInterval: BillingInterval
  ): Promise<{ price: number; currency: string; isPromo: boolean; plan: SubscriptionPlan | null }> {
    const plan = await this.getSubscriptionPlan(planIdentifier);
    if (!plan) return { price: 0, currency: 'ZAR', isPromo: false, plan: null };

    // Detect promo eligibility for Quantum Pro
    const nameLower = (plan.name || '').toLowerCase();
    const idLower = String(planIdentifier || '').toLowerCase();
    const isQuantum = plan.tier === 'premium' && (nameLower.includes('quantum') || idLower === 'quantum-pro');

    let isPromo = false;
    let price = billingInterval === 'monthly' ? plan.price_monthly : plan.price_annual;

    if (isQuantum && this.promoRules['quantum-pro']?.enabled) {
      try {
        // Attempt to count current subscribers for this specific plan ID (DB UUID required)
        let promoAvailable = true;

        // Only check counts if the plan ID looks like a UUID; otherwise assume promo available (dev fallback)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(plan.id)) {
          const { count } = await supabase
            .from('platform_subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('plan_id', plan.id)
            .in('status', ['trial', 'active', 'past_due']);

          const { limit } = this.promoRules['quantum-pro'];
          promoAvailable = (count || 0) < limit;
        }

        if (promoAvailable) {
          isPromo = true;
          if (billingInterval === 'monthly') {
            price = this.promoRules['quantum-pro'].monthly;
          } else {
            const multiplier = this.promoRules['quantum-pro'].annualMultiplier ?? 1;
            price = Math.round(this.promoRules['quantum-pro'].monthly * 12 * multiplier * 100) / 100;
          }
        }
      } catch (err) {
        // On any error, fall back to non-promo price rather than blocking purchase
        log.error('Error evaluating promo eligibility:', err);
      }
    }

    return { price, currency: plan.currency, isPromo, plan };
  }

  /**
   * Get all available subscription plans
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;

      return (plans || []).map(this.mapDBPlanToSubscriptionPlan.bind(this));
    } catch (error) {
      log.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  /**
   * Get subscription plan by ID (slug/UUID), tier, or name, mapping DB rows to app shape.
   */
  static async getSubscriptionPlan(identifier: string): Promise<SubscriptionPlan | null> {
    try {
      if (!identifier) return null;
      const idLower = String(identifier).toLowerCase();

      // Recognize common slugs and tiers
      const slugToName: Record<string, string> = {
        'free-tier': 'Free',
        'neural-starter': 'Basic',
        'quantum-pro': 'Pro',
        'singularity': 'Enterprise',
        free: 'Free',
        starter: 'Basic',
        basic: 'Basic',
        premium: 'Pro',
        pro: 'Pro',
        enterprise: 'Enterprise',
      };

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      let planRow: any | null = null;

      if (uuidRegex.test(identifier)) {
        // Lookup by UUID id
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', identifier)
          .eq('is_active', true)
          .single();
        if (error) {
          log.info('Plan lookup by UUID failed, will attempt name/slug mapping:', error.message || error);
        }
        planRow = data ?? null;
      }

      if (!planRow) {
        // Try to resolve to a known display name via slug/tier
        const targetName = slugToName[idLower] || identifier;
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('name', targetName)
          .eq('is_active', true)
          .maybeSingle();
        if (!error && data) {
          planRow = data;
        }
      }

      if (planRow) {
        return this.mapDBPlanToSubscriptionPlan(planRow);
      }

      // Fallback mapping for dev/local when DB is empty or unmatched
      const now = new Date().toISOString();
      const map: Record<string, SubscriptionPlan> = {
        'free-tier': {
          id: 'free-tier',
          name: 'Free Tier',
          tier: 'free',
          price_monthly: 0,
          price_annual: 0,
          currency: 'ZAR',
          features: ['basic_lessons', 'class_management', 'student_enrollment'],
limits: { students: 3, ai_lessons_per_month: 5, ai_tutors: 0, schools: 1, storage_gb: 1 },
          trial_days: 0,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        'neural-starter': {
          id: 'neural-starter',
          name: 'Basic',
          tier: 'starter',
          price_monthly: 49,
          price_annual: Math.round(49 * 12 * 0.83),
          currency: 'ZAR',
          features: ['ai_lesson_generator', 'class_management', 'basic_lessons', 'student_enrollment'],
limits: { students: 15, ai_lessons_per_month: 25, ai_tutors: 2, schools: 1, storage_gb: 5 },
          trial_days: 14,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        'quantum-pro': {
          id: 'quantum-pro',
          name: 'Pro',
          tier: 'premium',
          price_monthly: 149,
          price_annual: Math.round(149 * 12 * 0.83),
          currency: 'ZAR',
          features: ['ai_lesson_generator', 'homework_grader', 'stem_activities', 'progress_analysis', 'class_management', 'basic_lessons', 'student_enrollment'],
limits: { students: 50, ai_lessons_per_month: null, ai_tutors: 5, schools: 1, storage_gb: 50 },
          trial_days: 14,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
        'singularity': {
          id: 'singularity',
          name: 'Enterprise',
          tier: 'enterprise',
          price_monthly: 999,
          price_annual: Math.round(999 * 12 * 0.83),
          currency: 'ZAR',
          features: ['ai_lesson_generator', 'homework_grader', 'stem_activities', 'progress_analysis', 'class_management', 'basic_lessons', 'student_enrollment'],
limits: { students: null, ai_lessons_per_month: null, ai_tutors: null, schools: null, storage_gb: null },
          trial_days: 30,
          is_active: true,
          created_at: now,
          updated_at: now,
        },
      };

      if (map[idLower]) return map[idLower];

      // Try tier to slug fallback
      const tierMap: Record<string, string> = {
        free: 'free-tier',
        starter: 'neural-starter',
        premium: 'quantum-pro',
        enterprise: 'singularity',
      };
      const mapped = tierMap[idLower];
      if (mapped && map[mapped]) return map[mapped];

      return null;
    } catch (error) {
      log.error('Error fetching subscription plan:', error);
      return null;
    }
  }

  /**
   * Get subscription plan by tier specifically (maps tier to display name)
   */
  static async getPlanByTier(tier: PlanTier): Promise<SubscriptionPlan | null> {
    try {
      const { data: planRow } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .maybeSingle();

      if (planRow) return this.mapDBPlanToSubscriptionPlan(planRow);
      // Fallback: attempt lookup by name mapping if tier column not present/populated
      return await this.getSubscriptionPlan(tier);
    } catch (error) {
      log.error('Error fetching subscription plan by tier:', error);
      return null;
    }
  }

  /**
   * Create or update subscription plan (superadmin only)
   */
  static async upsertSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>): Promise<SubscriptionPlan | null> {
    try {
      const { data: upsertedPlan, error } = await supabase
        .from('subscription_plans')
        .upsert({
          ...plan,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapDBPlanToSubscriptionPlan(upsertedPlan);
    } catch (error) {
      log.error('Error upserting subscription plan:', error);
      return null;
    }
  }

  // =====================================================
  // PAYFAST INTEGRATION
  // =====================================================

  /**
   * Generate PayFast signature for security
   */
  private static async generatePayFastSignature(data: Record<string, string>, passphrase?: string): Promise<string> {
    // Remove signature and empty fields
    const filteredData = Object.keys(data)
      .filter(key => key !== 'signature' && data[key] !== '' && data[key] !== undefined)
      .sort()
      .reduce((obj: Record<string, string>, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    // Create parameter string
    let parameterString = Object.keys(filteredData)
      .map(key => `${key}=${encodeURIComponent(filteredData[key])}`)
      .join('&');

    // Add passphrase if provided
    if (passphrase) {
      parameterString += `&passphrase=${encodeURIComponent(passphrase)}`;
    }

    // Generate MD5 hash (Expo Crypto)
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      parameterString
    );
    return hash;
  }

  /**
   * Create PayFast subscription
   */
  static async createPayFastSubscription(
    request: CreateSubscriptionRequest & {
      return_url: string;
      cancel_url: string;
      notify_url: string;
      user_details: {
        first_name: string;
        last_name: string;
        email: string;
      };
    }
  ): Promise<{ payment_url: string; payment_id: string } | null> {
    try {
      const plan = await this.getSubscriptionPlan(request.plan_id);
      if (!plan) return null;

      const { price: effectivePrice, isPromo } = await this.getEffectivePricing(request.plan_id, request.billing_interval);
      const frequency = request.billing_interval === 'monthly' ? '3' : '6'; // 3 = Monthly, 6 = Annual
      
      // Calculate billing date (start after trial period or immediately)
      const billingDate = new Date();
      if (plan.trial_days > 0) {
        billingDate.setDate(billingDate.getDate() + plan.trial_days);
      }

      const paymentId = `edudash-${request.user_id}-${Date.now()}`;
      
      const { merchantId, merchantKey, passphrase } = this.getPayfastConfig();
      if (!merchantId || !merchantKey) {
        log.error('Missing PayFast credentials (PAYFAST_MERCHANT_ID/KEY)');
        return null;
      }

      const subscriptionData: PayFastSubscriptionData = {
        merchant_id: merchantId,
        merchant_key: merchantKey,
        return_url: request.return_url,
        cancel_url: request.cancel_url,
        notify_url: request.notify_url,
        name_first: request.user_details.first_name,
        name_last: request.user_details.last_name,
        email_address: request.user_details.email,
        m_payment_id: paymentId,
        amount: plan.trial_days > 0 ? '0.00' : effectivePrice.toFixed(2), // Free during trial
        item_name: `EduDash Pro ${plan.name}${isPromo ? ' (Promo)' : ''}`,
        item_description: `${plan.name} subscription - ${request.billing_interval} billing`,
        subscription_type: '1', // Regular subscription
        billing_date: billingDate.toISOString().split('T')[0], // YYYY-MM-DD format
        recurring_amount: effectivePrice.toFixed(2),
        frequency: frequency,
        cycles: '0' // Until cancelled
      };

      // Add passphrase if available
      if (passphrase) {
        subscriptionData.passphrase = passphrase;
      }

      // Generate signature
      subscriptionData.signature = await this.generatePayFastSignature(subscriptionData as any, passphrase);

      // Create the payment URL with parameters
      const params = new URLSearchParams();
      Object.entries(subscriptionData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'passphrase') {
          params.append(key, value.toString());
        }
      });

      const paymentUrl = `${this.getPayfastBaseUrl()}?${params.toString()}`;

      return {
        payment_url: paymentUrl,
        payment_id: paymentId
      };
    } catch (error) {
      log.error('Error creating PayFast subscription:', error);
      return null;
    }
  }

  /**
   * Validate PayFast ITN (Instant Transaction Notification)
   */
  static async validatePayFastITN(notification: PayFastNotification): Promise<boolean> {
    try {
      const { passphrase, merchantId } = this.getPayfastConfig();

      // Validate signature
      const dataToValidate: any = { ...notification };
      delete dataToValidate.signature;
      
      const calculatedSignature = await this.generatePayFastSignature(dataToValidate as any, passphrase);
      
      if (calculatedSignature !== notification.signature) {
        log.error('PayFast signature validation failed');
        return false;
      }

      // Validate merchant ID
      if (merchantId && notification.merchant_id !== merchantId) {
        log.error('PayFast merchant ID validation failed');
        return false;
      }

      // Additional validation: verify with PayFast servers
      const validationData = new URLSearchParams();
      Object.entries(notification).forEach(([key, value]) => {
        if (key !== 'signature') {
          validationData.append(key, value.toString());
        }
      });

      const validationUrl = this.getPayfastValidateUrl();

      const response = await fetch(validationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: validationData.toString()
      });

      const validationResult = await response.text();
      return validationResult === 'VALID';
    } catch (error) {
      log.error('Error validating PayFast ITN:', error);
      return false;
    }
  }

  /**
   * Handle PayFast ITN notification
   */
  static async handlePayFastNotification(notification: PayFastNotification): Promise<boolean> {
    try {
      // Validate the notification first
      const isValid = await this.validatePayFastITN(notification);
      if (!isValid) {
        log.error('Invalid PayFast notification received');
        return false;
      }

      log.info('Processing PayFast notification:', notification.payment_status);

      switch (notification.payment_status) {
        case 'COMPLETE':
          return await this.handlePayFastPaymentComplete(notification);
        
        case 'FAILED':
          return await this.handlePayFastPaymentFailed(notification);
        
        case 'PENDING':
          return await this.handlePayFastPaymentPending(notification);
        
        default:
          log.info('Unhandled PayFast payment status:', notification.payment_status);
          return true;
      }
    } catch (error) {
      log.error('Error handling PayFast notification:', error);
      return false;
    }
  }

  private static async handlePayFastPaymentComplete(notification: PayFastNotification): Promise<boolean> {
    try {
      // Update subscription status to active
      const { error: subError } = await supabase
        .from('platform_subscriptions')
        .update({
          status: 'active',
          provider_subscription_id: notification.pf_payment_id,
          updated_at: new Date().toISOString()
        })
        .eq('metadata->payment_id', notification.m_payment_id);

      // Log the successful payment
      const { error: logError } = await (supabase as any)
        .from('subscription_payments')
        .insert({
          subscription_id: notification.m_payment_id,
          amount: parseFloat(notification.amount_net),
          currency: 'ZAR',
          status: 'completed',
          provider_payment_id: notification.pf_payment_id,
          processed_at: notification.billing_date,
          metadata: {
            payfast_notification: notification,
            fee_amount: parseFloat(notification.amount_fee)
          }
        });

      return !subError && !logError;
    } catch (error) {
      log.error('Error handling PayFast payment complete:', error);
      return false;
    }
  }

  private static async handlePayFastPaymentFailed(notification: PayFastNotification): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('platform_subscriptions')
        .update({
          status: 'past_due',
          updated_at: new Date().toISOString(),
          metadata: {
            last_payment_failure: {
              date: notification.billing_date,
              reason: 'PayFast payment failed',
              pf_payment_id: notification.pf_payment_id
            }
          }
        })
        .eq('metadata->payment_id', notification.m_payment_id);

      return !error;
    } catch (error) {
      log.error('Error handling PayFast payment failed:', error);
      return false;
    }
  }

  private static async handlePayFastPaymentPending(notification: PayFastNotification): Promise<boolean> {
    try {
      // Log the pending payment but don't change subscription status yet
      const { error } = await (supabase as any)
        .from('subscription_payments')
        .insert({
          subscription_id: notification.m_payment_id,
          amount: parseFloat(notification.amount_gross),
          currency: 'ZAR',
          status: 'pending',
          provider_payment_id: notification.pf_payment_id,
          processed_at: notification.billing_date,
          metadata: {
            payfast_notification: notification
          }
        });

      return !error;
    } catch (error) {
      log.error('Error handling PayFast payment pending:', error);
      return false;
    }
  }

  // =====================================================
  // PAYPAL INTEGRATION
  // =====================================================

  /**
   * Get PayPal access token
   */
  private static async getPayPalAccessToken(): Promise<string | null> {
    try {
      const { clientId, clientSecret } = this.getPayPalCreds();
      if (!clientId || !clientSecret) {
        log.error('Missing PayPal credentials (PAYPAL_CLIENT_ID/SECRET)');
        return null;
      }
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await fetch(`${this.getPaypalBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`PayPal auth failed: ${data.error_description || data.error}`);
      }

      return data.access_token;
    } catch (error) {
      log.error('Error getting PayPal access token:', error);
      return null;
    }
  }

  /**
   * Create PayPal subscription plan
   */
  static async createPayPalPlan(subscriptionPlan: SubscriptionPlan, billingInterval: BillingInterval): Promise<string | null> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      if (!accessToken) return null;

      const price = billingInterval === 'monthly' ? subscriptionPlan.price_monthly : subscriptionPlan.price_annual;
      const interval = billingInterval === 'monthly' ? 'MONTH' : 'YEAR';
      const intervalCount = 1;

      const planData = {
        product_id: `edudash-pro-${subscriptionPlan.tier}`,
        name: `EduDash Pro ${subscriptionPlan.name} (${billingInterval})`,
        description: `${subscriptionPlan.name} plan billed ${billingInterval}`,
        status: 'ACTIVE',
        billing_cycles: [
          ...(subscriptionPlan.trial_days > 0 ? [{
            frequency: {
              interval_unit: 'DAY',
              interval_count: subscriptionPlan.trial_days
            },
            tenure_type: 'TRIAL',
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: {
                value: '0',
                currency_code: subscriptionPlan.currency
              }
            }
          }] : []),
          {
            frequency: {
              interval_unit: interval,
              interval_count: intervalCount
            },
            tenure_type: 'REGULAR',
            sequence: subscriptionPlan.trial_days > 0 ? 2 : 1,
            total_cycles: 0, // infinite
            pricing_scheme: {
              fixed_price: {
                value: price.toString(),
                currency_code: subscriptionPlan.currency
              }
            }
          }
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee: {
            value: '0',
            currency_code: subscriptionPlan.currency
          },
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3
        },
        taxes: {
          percentage: '0',
          inclusive: false
        }
      };

      const response = await fetch(`${this.getPaypalBaseUrl()}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `edudash-plan-${subscriptionPlan.tier}-${billingInterval}-${Date.now()}`
        },
        body: JSON.stringify(planData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal plan creation failed: ${JSON.stringify(result)}`);
      }

      log.info('PayPal plan created successfully:', result.id);
      return result.id;
    } catch (error) {
      log.error('Error creating PayPal plan:', error);
      return null;
    }
  }

  /**
   * Create PayPal subscription
   */
  static async createPayPalSubscription(request: CreateSubscriptionRequest & { paypal_plan_id: string; return_url: string; cancel_url: string }): Promise<{ approval_url: string; subscription_id: string } | null> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      if (!accessToken) return null;

      const subscriptionData = {
        plan_id: request.paypal_plan_id,
        start_time: new Date(Date.now() + 60000).toISOString(), // Start 1 minute from now
        quantity: '1',
        shipping_amount: {
          currency_code: 'ZAR',
          value: '0'
        },
        subscriber: {
          name: {
            given_name: request.metadata?.first_name || 'User',
            surname: request.metadata?.last_name || 'Name'
          },
          email_address: request.metadata?.email || 'user@example.com'
        },
        application_context: {
          brand_name: 'EduDash Pro',
          locale: 'en-ZA',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: request.return_url,
          cancel_url: request.cancel_url
        }
      };

      const response = await fetch(`${this.getPaypalBaseUrl()}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `edudash-sub-${request.user_id}-${Date.now()}`
        },
        body: JSON.stringify(subscriptionData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal subscription creation failed: ${JSON.stringify(result)}`);
      }

      // Find approval URL
      const approvalLink = result.links?.find((link: any) => link.rel === 'approve');
      if (!approvalLink) {
        throw new Error('No approval URL found in PayPal response');
      }

      return {
        approval_url: approvalLink.href,
        subscription_id: result.id
      };
    } catch (error) {
      log.error('Error creating PayPal subscription:', error);
      return null;
    }
  }

  /**
   * Get PayPal subscription details
   */
  static async getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscriptionResponse | null> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      if (!accessToken) return null;

      const response = await fetch(`${this.getPaypalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`PayPal subscription fetch failed: ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      log.error('Error fetching PayPal subscription:', error);
      return null;
    }
  }

  /**
   * Cancel PayPal subscription
   */
  static async cancelPayPalSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<boolean> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      if (!accessToken) return false;

      const response = await fetch(`${this.getPaypalBaseUrl()}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reason: reason
        })
      });

      return response.ok;
    } catch (error) {
      log.error('Error canceling PayPal subscription:', error);
      return false;
    }
  }

  // =====================================================
  // SUBSCRIPTION MANAGEMENT
  // =====================================================

  /**
   * Create new platform subscription
   */
  static async createSubscription(request: CreateSubscriptionRequest): Promise<PlatformSubscription | null> {
    try {
      // Get the subscription plan
      const plan = await this.getSubscriptionPlan(request.plan_id);
      if (!plan) {
        throw new Error('Subscription plan not found');
      }

      const now = new Date();
      const trialEnd = plan.trial_days > 0 ? new Date(now.getTime() + plan.trial_days * 24 * 60 * 60 * 1000) : null;
      const periodStart = trialEnd || now;
      const periodEnd = new Date(periodStart);
      
      if (request.billing_interval === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      } else {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      }

      // Determine effective recurring amount (handles promotional pricing)
      const { price: effectivePrice, isPromo } = await this.getEffectivePricing(plan.id, request.billing_interval);

      const subscriptionData = {
        user_id: request.user_id,
        plan_id: plan.id,
        status: plan.trial_days > 0 ? 'trial' as SubscriptionStatus : 'active' as SubscriptionStatus,
        billing_interval: request.billing_interval,
        amount: effectivePrice,
        currency: plan.currency,
        trial_start: plan.trial_days > 0 ? now.toISOString() : null,
        trial_end: trialEnd?.toISOString() || null,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider: request.payment_provider,
        provider_customer_id: request.provider_customer_id || null,
        metadata: {
          ...(request.metadata || {}),
          is_promo_price: isPromo,
          effective_price: effectivePrice,
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      const { data: subscription, error } = await supabase
        .from('platform_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;
      return subscription as unknown as PlatformSubscription;
    } catch (error) {
      log.error('Error creating subscription:', error);
      return null;
    }
  }

  /**
   * Get user's current subscription
   */
  static async getUserSubscription(userId: string): Promise<PlatformSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('platform_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .in('status', ['trial', 'active', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (subscription as unknown as PlatformSubscription) || null;
    } catch (error) {
      log.error('Error fetching user subscription:', error);
      return null;
    }
  }

  /**
   * Get recent payments for the current user (joins through platform_subscriptions)
   */
  static async getRecentPayments(userId: string, limit: number = 10): Promise<{ data: Array<{ id: string; amount: number; currency: string; status: string; processed_at: string; provider_payment_id: string | null }>; error: any }> {
    try {
      // Join payments -> subscription -> user
      const { data, error } = await (supabase as any)
        .from('subscription_payments')
        .select(`
          id,
          amount,
          currency,
          status,
          processed_at,
          provider_payment_id,
          subscription:platform_subscriptions!inner(user_id)
        `)
        .eq('subscription.user_id', userId)
        .order('processed_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        amount: Number(p.amount || 0),
        currency: p.currency || 'ZAR',
        status: String(p.status || 'unknown'),
        processed_at: p.processed_at || new Date().toISOString(),
        provider_payment_id: p.provider_payment_id || null,
      }));
      return { data: mapped, error: null };
    } catch (error) {
      log.error('Error fetching recent payments:', error);
      return { data: [], error } as any;
    }
  }

  /**
   * Update subscription status
   */
  static async updateSubscriptionStatus(
    subscriptionId: string, 
    status: SubscriptionStatus, 
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'canceled') {
        updateData.canceled_at = new Date().toISOString();
      }
      
      if (status === 'expired') {
        updateData.ended_at = new Date().toISOString();
      }

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { error } = await supabase
        .from('platform_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('Error updating subscription status:', error);
      return false;
    }
  }

  /**
   * Handle subscription upgrade/downgrade
   */
  static async changeSubscriptionPlan(
    subscriptionId: string,
    newPlanId: string,
    billingInterval?: BillingInterval
  ): Promise<boolean> {
    try {
      const newPlan = await this.getSubscriptionPlan(newPlanId);
      if (!newPlan) return false;

      const { data: currentSub } = await supabase
        .from('platform_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!currentSub) return false;

      const updateData = {
        plan_id: newPlan.id,
        amount: billingInterval === 'annual' ? newPlan.price_annual : newPlan.price_monthly,
        billing_interval: billingInterval || currentSub.billing_interval,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('platform_subscriptions')
        .update(updateData)
        .eq('id', subscriptionId);

      if (error) throw error;
      return true;
    } catch (error) {
      log.error('Error changing subscription plan:', error);
      return false;
    }
  }


  // =====================================================
  // WEBHOOK HANDLING
  // =====================================================

  /**
   * Handle webhook events from any payment provider
   */
  static async handleWebhook(provider: PaymentProvider, payload: any): Promise<boolean> {
    switch (provider) {
      case 'payfast':
        return await this.handlePayFastNotification(payload as PayFastNotification);
      case 'paypal':
        return await this.handlePayPalWebhook(payload as PayPalWebhookEvent);
      default:
        log.warn('Unsupported payment provider webhook:', provider);
        return false;
    }
  }

  /**
   * Handle PayPal webhook events
   */
  static async handlePayPalWebhook(event: PayPalWebhookEvent): Promise<boolean> {
    try {
      log.info('Processing PayPal webhook:', event.event_type);

      switch (event.event_type) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          return await this.handleSubscriptionActivated(event);
        
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          return await this.handleSubscriptionCancelled(event);
        
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          return await this.handleSubscriptionSuspended(event);
        
        case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
          return await this.handlePaymentFailed(event);
        
        case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
          return await this.handlePaymentCompleted(event);
        
        default:
          log.info('Unhandled PayPal webhook event:', event.event_type);
          return true;
      }
    } catch (error) {
      log.error('Error handling PayPal webhook:', error);
      return false;
    }
  }

  private static async handleSubscriptionActivated(event: PayPalWebhookEvent): Promise<boolean> {
    const subscriptionId = event.resource.id;
    
    const { error } = await supabase
      .from('platform_subscriptions')
      .update({
        status: 'active',
        provider_subscription_id: subscriptionId,
        updated_at: new Date().toISOString()
      })
      .eq('provider_subscription_id', subscriptionId);

    return !error;
  }

  private static async handleSubscriptionCancelled(event: PayPalWebhookEvent): Promise<boolean> {
    const subscriptionId = event.resource.id;
    
    const { error } = await supabase
      .from('platform_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('provider_subscription_id', subscriptionId);

    return !error;
  }

  private static async handleSubscriptionSuspended(event: PayPalWebhookEvent): Promise<boolean> {
    const subscriptionId = event.resource.id;
    
    const { error } = await supabase
      .from('platform_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('provider_subscription_id', subscriptionId);

    return !error;
  }

  private static async handlePaymentFailed(event: PayPalWebhookEvent): Promise<boolean> {
    const subscriptionId = event.resource.billing_agreement_id;
    
    // Update subscription to past_due and log the failure
    const { error } = await supabase
      .from('platform_subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
        metadata: {
          last_payment_failure: {
            date: event.create_time,
            reason: event.summary,
            event_id: event.id
          }
        }
      })
      .eq('provider_subscription_id', subscriptionId);

    return !error;
  }

  private static async handlePaymentCompleted(event: PayPalWebhookEvent): Promise<boolean> {
    const subscriptionId = event.resource.billing_agreement_id;
    const amount = parseFloat(event.resource.amount.total);
    
    // Update subscription to active if it was past_due
    const { error: subError } = await supabase
      .from('platform_subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('provider_subscription_id', subscriptionId)
      .eq('status', 'past_due');

    // Log the successful payment
    const { error: logError } = await (supabase as any)
      .from('subscription_payments')
      .insert({
        subscription_id: subscriptionId,
        amount: amount,
        currency: event.resource.amount.currency,
        status: 'completed',
        provider_payment_id: event.resource.id,
        processed_at: event.create_time,
        metadata: {
          webhook_event_id: event.id,
          payment_details: event.resource
        }
      });

    return !subError && !logError;
  }

  // =====================================================
  // ANALYTICS & REPORTING
  // =====================================================

  /**
   * Get subscription analytics for superadmin dashboard
   */
  static async getSubscriptionAnalytics(
    dateRange?: { start: Date; end: Date }
  ): Promise<SubscriptionAnalytics | null> {
    try {
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = dateRange?.end || new Date();

      // Get subscription counts
      const { data: allSubs } = await supabase
        .from('platform_subscriptions')
        .select('status, amount, billing_interval, plan:subscription_plans(tier, name)');

      if (!allSubs) return null;

      const activeSubs = allSubs.filter(s => ['active', 'trial'].includes(s.status));
      const trialSubs = allSubs.filter(s => s.status === 'trial');
      const canceledSubs = allSubs.filter(s => s.status === 'canceled');

      // Calculate MRR and ARR
      const monthlyRevenue = activeSubs
        .filter(s => s.billing_interval === 'monthly')
        .reduce((sum, s) => sum + s.amount, 0);
      
      const annualRevenue = activeSubs
        .filter(s => s.billing_interval === 'annual')
        .reduce((sum, s) => sum + (s.amount / 12), 0); // Convert to monthly for MRR

      const mrr = monthlyRevenue + annualRevenue;
      const arr = mrr * 12;

      // Revenue by plan
      const revenueByPlan: Record<PlanTier, number> = {
        free: 0,
        starter: 0,
        basic: 0,
        premium: 0,
        pro: 0,
        enterprise: 0
      };

      // Subscriber breakdown
      const subscriberBreakdown: Record<PlanTier, number> = {
        free: 0,
        starter: 0,
        basic: 0,
        premium: 0,
        pro: 0,
        enterprise: 0
      };

      activeSubs.forEach(sub => {
        const tier = sub.plan?.tier as PlanTier;
        if (tier) {
          revenueByPlan[tier] += sub.billing_interval === 'monthly' ? sub.amount : sub.amount / 12;
          subscriberBreakdown[tier]++;
        }
      });

      // Get recent transactions
      const { data: recentTransactions } = await (supabase as any)
        .from('subscription_payments')
        .select(`
          id,
          amount,
          status,
          created_at,
          subscription:platform_subscriptions(
            user:users(email),
            plan:subscription_plans(name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const formattedTransactions = ((recentTransactions as any[]) || []).map((t: any) => ({
        id: t.id,
        user_email: t.subscription?.user?.email || 'Unknown',
        plan_name: t.subscription?.plan?.name || 'Unknown',
        amount: t.amount,
        status: t.status,
        created_at: t.created_at
      }));

      // Calculate rates
      const totalSubscribers = allSubs.length;
      const churnRate = totalSubscribers > 0 ? (canceledSubs.length / totalSubscribers) * 100 : 0;
      const conversionRate = totalSubscribers > 0 ? (activeSubs.length / (activeSubs.length + trialSubs.length)) * 100 : 0;
      const arpu = activeSubs.length > 0 ? mrr / activeSubs.length : 0;

      return {
        total_subscribers: totalSubscribers,
        active_subscriptions: activeSubs.length,
        trial_subscriptions: trialSubs.length,
        canceled_subscriptions: canceledSubs.length,
        monthly_recurring_revenue: Math.round(mrr * 100) / 100,
        annual_recurring_revenue: Math.round(arr * 100) / 100,
        average_revenue_per_user: Math.round(arpu * 100) / 100,
        churn_rate: Math.round(churnRate * 100) / 100,
        growth_rate: 0, // TODO: Calculate based on historical data
        conversion_rate: Math.round(conversionRate * 100) / 100,
        revenue_by_plan: revenueByPlan,
        subscriber_breakdown: subscriberBreakdown,
        recent_transactions: formattedTransactions
      };
    } catch (error) {
      log.error('Error fetching subscription analytics:', error);
      return null;
    }
  }

  /**
   * Get revenue trends over time
   */
  static async getRevenueTrends(months: number = 12): Promise<Array<{ month: string; revenue: number; subscribers: number }>> {
    try {
      const trends = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        
      const { data: payments } = await (supabase as any)
          .from('subscription_payments')
          .select('amount')
          .gte('processed_at', date.toISOString())
          .lt('processed_at', nextMonth.toISOString())
          .eq('status', 'completed');

        const { data: subscriptions } = await supabase
          .from('platform_subscriptions')
          .select('id')
          .gte('created_at', date.toISOString())
          .lt('created_at', nextMonth.toISOString());

      const revenue = Array.isArray(payments) ? (payments as any[]).reduce((sum, p: any) => sum + (p.amount ?? 0), 0) : 0;
        const subscribers = (subscriptions || []).length;

        trends.push({
          month: date.toISOString().substring(0, 7), // YYYY-MM format
          revenue: Math.round(revenue * 100) / 100,
          subscribers
        });
      }

      return trends;
    } catch (error) {
      log.error('Error fetching revenue trends:', error);
      return [];
    }
  }
}
