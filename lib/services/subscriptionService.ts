import { supabase } from '../supabase';
import type { Database } from '../../types/database';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('subscription');

// Database types
type SubscriptionPlanDB = Database['public']['Tables']['subscription_plans']['Row'];
type PlatformSubscriptionDB = Database['public']['Tables']['platform_subscriptions']['Row'];
type SubscriptionPaymentDB = Database['public']['Tables']['subscription_payments']['Row'];
type SubscriptionEventDB = Database['public']['Tables']['subscription_events']['Row'];

type CreateSubscriptionData = Database['public']['Tables']['platform_subscriptions']['Insert'];
type CreatePaymentData = Database['public']['Tables']['subscription_payments']['Insert'];

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type PlanTier = 'free' | 'starter' | 'premium' | 'enterprise';
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
    ai_lessons_per_day: number | null;
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
  trial_start?: string;
  trial_end?: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  ended_at?: string;
  payment_provider: PaymentProvider;
  provider_subscription_id?: string;
  provider_customer_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
  private static paypalClientId = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_ID;
  private static paypalClientSecret = process.env.EXPO_PUBLIC_PAYPAL_CLIENT_SECRET;
  private static paypalBaseUrl = process.env.EXPO_PUBLIC_PAYPAL_ENV === 'production' 
    ? 'https://api-m.paypal.com' 
    : 'https://api-m.sandbox.paypal.com';
  
  // PayFast configuration
  private static payfastMerchantId = process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_ID;
  private static payfastMerchantKey = process.env.EXPO_PUBLIC_PAYFAST_MERCHANT_KEY;
  private static payfastPassphrase = process.env.EXPO_PUBLIC_PAYFAST_PASSPHRASE;
  private static payfastBaseUrl = process.env.EXPO_PUBLIC_PAYFAST_ENV === 'production'
    ? 'https://www.payfast.co.za/eng/process'
    : 'https://sandbox.payfast.co.za/eng/process';

  // =====================================================
  // SUBSCRIPTION PLANS MANAGEMENT
  // =====================================================

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
    return (plans || []) as SubscriptionPlan[];
    } catch (error) {
      log.error('Error fetching subscription plans:', error);
      return [];
    }
  }

  /**
   * Get subscription plan by ID or tier
   */
  static async getSubscriptionPlan(identifier: string): Promise<SubscriptionPlan | null> {
    try {
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .or(`id.eq.${identifier},tier.eq.${identifier}`)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return plan as SubscriptionPlan;
    } catch (error) {
      log.error('Error fetching subscription plan:', error);
      return null;
    }
  }

  /**
   * Get subscription plan by tier specifically
   */
  static async getPlanByTier(tier: PlanTier): Promise<SubscriptionPlan | null> {
    try {
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('tier', tier)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return plan as SubscriptionPlan;
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
      return upsertedPlan;
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
  private static generatePayFastSignature(data: Record<string, string>, passphrase?: string): string {
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

    // Generate MD5 hash
    const crypto = require('crypto');
    return crypto.createHash('md5').update(parameterString).digest('hex');
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

      const amount = request.billing_interval === 'monthly' ? plan.price_monthly : plan.price_annual;
      const frequency = request.billing_interval === 'monthly' ? '3' : '6'; // 3 = Monthly, 6 = Annual
      
      // Calculate billing date (start after trial period or immediately)
      const billingDate = new Date();
      if (plan.trial_days > 0) {
        billingDate.setDate(billingDate.getDate() + plan.trial_days);
      }

      const paymentId = `edudash-${request.user_id}-${Date.now()}`;
      
      const subscriptionData: PayFastSubscriptionData = {
        merchant_id: this.payfastMerchantId!,
        merchant_key: this.payfastMerchantKey!,
        return_url: request.return_url,
        cancel_url: request.cancel_url,
        notify_url: request.notify_url,
        name_first: request.user_details.first_name,
        name_last: request.user_details.last_name,
        email_address: request.user_details.email,
        m_payment_id: paymentId,
        amount: plan.trial_days > 0 ? '0.00' : amount.toFixed(2), // Free during trial
        item_name: `EduDash Pro ${plan.name}`,
        item_description: `${plan.name} subscription - ${request.billing_interval} billing`,
        subscription_type: '1', // Regular subscription
        billing_date: billingDate.toISOString().split('T')[0], // YYYY-MM-DD format
        recurring_amount: amount.toFixed(2),
        frequency: frequency,
        cycles: '0' // Until cancelled
      };

      // Add passphrase if available
      if (this.payfastPassphrase) {
        subscriptionData.passphrase = this.payfastPassphrase;
      }

      // Generate signature
      subscriptionData.signature = this.generatePayFastSignature(subscriptionData as any, this.payfastPassphrase);

      // Create the payment URL with parameters
      const params = new URLSearchParams();
      Object.entries(subscriptionData).forEach(([key, value]) => {
        if (value !== undefined && key !== 'passphrase') {
          params.append(key, value.toString());
        }
      });

      const paymentUrl = `${this.payfastBaseUrl}?${params.toString()}`;

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
      // Validate signature
      const dataToValidate = { ...notification };
      delete dataToValidate.signature;
      
      const calculatedSignature = this.generatePayFastSignature(dataToValidate as any, this.payfastPassphrase);
      
      if (calculatedSignature !== notification.signature) {
        log.error('PayFast signature validation failed');
        return false;
      }

      // Validate merchant ID
      if (notification.merchant_id !== this.payfastMerchantId) {
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

      const validationUrl = process.env.EXPO_PUBLIC_PAYFAST_ENV === 'production'
        ? 'https://www.payfast.co.za/eng/query/validate'
        : 'https://sandbox.payfast.co.za/eng/query/validate';

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
      const { error: logError } = await supabase
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
      const { error } = await supabase
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
      const auth = Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64');
      
      const response = await fetch(`${this.paypalBaseUrl}/v1/oauth2/token`, {
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

      const response = await fetch(`${this.paypalBaseUrl}/v1/billing/plans`, {
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

      const response = await fetch(`${this.paypalBaseUrl}/v1/billing/subscriptions`, {
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

      const response = await fetch(`${this.paypalBaseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
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

      const response = await fetch(`${this.paypalBaseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
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

      const subscriptionData = {
        user_id: request.user_id,
        plan_id: plan.id,
        status: plan.trial_days > 0 ? 'trial' as SubscriptionStatus : 'active' as SubscriptionStatus,
        billing_interval: request.billing_interval,
        amount: request.billing_interval === 'monthly' ? plan.price_monthly : plan.price_annual,
        currency: plan.currency,
        trial_start: plan.trial_days > 0 ? now.toISOString() : null,
        trial_end: trialEnd?.toISOString() || null,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider: request.payment_provider,
        provider_customer_id: request.provider_customer_id || null,
        metadata: request.metadata || {},
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };

      const { data: subscription, error } = await supabase
        .from('platform_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;
      return subscription;
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
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return subscription;
    } catch (error) {
      log.error('Error fetching user subscription:', error);
      return null;
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
    const { error: logError } = await supabase
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
        premium: 0,
        enterprise: 0
      };

      // Subscriber breakdown
      const subscriberBreakdown: Record<PlanTier, number> = {
        free: 0,
        starter: 0,
        premium: 0,
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
      const { data: recentTransactions } = await supabase
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

      const formattedTransactions = (recentTransactions || []).map(t => ({
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
        
        const { data: payments } = await supabase
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

        const revenue = (payments || []).reduce((sum, p) => sum + p.amount, 0);
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
