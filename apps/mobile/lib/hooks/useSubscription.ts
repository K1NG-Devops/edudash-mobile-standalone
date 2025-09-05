import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { SubscriptionService } from '@/lib/services/subscriptionService';
import { Platform, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import type { 
  PlatformSubscription, 
  SubscriptionPlan, 
  CreateSubscriptionRequest,
  BillingInterval,
  PaymentProvider 
} from '@/lib/services/subscriptionService';
import { createLogger } from '@/lib/utils/logger';

const log = createLogger('useSubscription');

interface UseSubscriptionReturn {
  // Current subscription state
  subscription: PlatformSubscription | null;
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createSubscription: (params: CreateSubscriptionParams) => Promise<CreateSubscriptionResponse>;
  refreshSubscription: () => Promise<void>;
  cancelSubscription: () => Promise<boolean>;
  
  // Helper functions
  isSubscriptionActive: () => boolean;
  isTrialActive: () => boolean;
  getDaysUntilExpiry: () => number | null;
  canUpgrade: (planTier: string) => boolean;
  canDowngrade: (planTier: string) => boolean;
}

interface CreateSubscriptionParams {
  plan_id: string;
  billing_interval: BillingInterval;
  payment_provider: PaymentProvider;
  user_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

interface CreateSubscriptionResponse {
  success: boolean;
  subscription_id?: string;
  payment_url?: string;
  approval_url?: string;
  payment_id?: string;
  error?: string;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<PlatformSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track whether a completed payment exists for the current period
  const [hasPaymentThisPeriod, setHasPaymentThisPeriod] = useState(false);

  // Fetch current subscription
  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const userSubscription = await SubscriptionService.getUserSubscription(user.id);
      setSubscription(userSubscription);
      log.info('User subscription loaded:', userSubscription?.status);

      // Derive payment state for the current billing period to avoid false "Active"
      try {
        setHasPaymentThisPeriod(false);
        if (userSubscription) {
          const { data: payments } = await SubscriptionService.getRecentPayments(user.id, 20);
          if (payments && payments.length > 0) {
            const start = new Date(userSubscription.current_period_start).getTime();
            const end = new Date(userSubscription.current_period_end).getTime();
            const paid = payments.some((p) => {
              const t = new Date(p.processed_at).getTime();
              return p.status === 'completed' && t >= start && t <= end;
            });
            setHasPaymentThisPeriod(paid);
          }
        }
      } catch (e) {
        // Non-fatal; keep conservative
        log.warn('Could not derive payment state for subscription:', e);
        setHasPaymentThisPeriod(false);
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch subscription';
      setError(errorMessage);
      log.error('Subscription fetch error:', err);
    }
  }, [user?.id]);

  // Fetch available plans
  const fetchPlans = useCallback(async () => {
    try {
      setError(null);
      const plans = await SubscriptionService.getSubscriptionPlans();
      setPlans(plans);
      log.info('Subscription plans loaded:', plans.length);
    } catch (err) {
      const errorMessage = 'Failed to fetch subscription plans';
      setError(errorMessage);
      log.error('Plans fetch error:', err);
    }
  }, []);

  // Create new subscription
  const createSubscription = useCallback(async (params: CreateSubscriptionParams): Promise<CreateSubscriptionResponse> => {
    if (!session || !user) {
      return { success: false, error: 'Authentication required' };
    }

    try {
      setError(null);
      
      // Resolve app base (used for user-facing return/cancel pages)
      const appBaseEnv = process.env.EXPO_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL || '';
      const appBase = appBaseEnv || ((typeof window !== 'undefined') ? window.location.origin : '');

      // Resolve API backend base (server that handles subscriptions)
      // If EXPO_PUBLIC_API_BASE is provided, we call that server (recommended for static hosting)
      // Otherwise, fall back to the same domain's /api (only valid if server routes are deployed there)
      const apiBase = process.env.EXPO_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE || '';

      const webhookBase = process.env.EXPO_PUBLIC_WEBHOOK_BASE || apiBase || appBase;

      // Resolve function names for Supabase Edge Functions
      const fnCreate = process.env.EXPO_PUBLIC_SUBSCRIPTIONS_CREATE_FN || 'subscriptions-create';
      const fnPayfast = process.env.EXPO_PUBLIC_WEBHOOK_PAYFAST_FN || 'webhooks-payfast';
      const fnPaypal = process.env.EXPO_PUBLIC_WEBHOOK_PAYPAL_FN || 'webhooks-paypal';
      const providerFn = params.payment_provider === 'payfast' ? fnPayfast : (params.payment_provider === 'paypal' ? fnPaypal : `webhooks-${params.payment_provider}`);

      const requestBody = {
        plan_id: params.plan_id,
        billing_interval: params.billing_interval,
        payment_provider: params.payment_provider,
        return_url: `${appBase}/payment/success`,
        cancel_url: `${appBase}/payment/cancel`,
        notify_url: `${(webhookBase || '').replace(/\/$/, '')}/${providerFn}`,
        user_details: {
          first_name: params.user_details?.first_name || user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User',
          last_name: params.user_details?.last_name || user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Name',
          email: params.user_details?.email || user.email || 'user@example.com'
        }
      };

      // Pick the correct create-subscription endpoint depending on whether an external API base is provided
      // For Supabase Edge Functions, apiBase should be ...supabase.co/functions/v1 and fnCreate is the function name
      const sanitizedApiBase = (apiBase || '').replace(/\/$/, '');
      const createPath = apiBase ? `${sanitizedApiBase}/${fnCreate}` : `${appBase}/api/subscriptions/create`;
      async function callCreate(url: string) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
'Authorization': `Bearer ${session!.access_token}` ,
          },
          body: JSON.stringify(requestBody)
        })
        return res
      }

      let response = await callCreate(createPath)

      // Fallback: if the configured function fails (404/500), try common alt names
      if (!response.ok) {
        try {
          const body = await response.text()
          log.error('Primary subscription endpoint failed:', response.status, body)
          // Specific migration hint: older function imports used std/hash/md5.ts (removed)
          if (body?.includes('std@0.223.0/hash/md5.ts')) {
            log.warn('[Subscriptions] Your Edge Function is importing std/hash/md5.ts. Update to std/crypto/md5.ts')
          }
        } catch {}

        const altFn = fnCreate === 'subscriptions' ? 'subscriptions-create' : 'subscriptions'
        const altPath = apiBase ? `${sanitizedApiBase}/${altFn}` : `${appBase}/api/subscriptions/create`
        if (apiBase) {
          log.info(`[Subscriptions] Retrying with alternate function name: ${altFn}`)
          response = await callCreate(altPath)
        }
      }

      // Try to parse JSON, but capture text for debugging on failure
      let data: any = null
      try {
        data = await response.json()
      } catch (e) {
        const text = await response.text().catch(() => '')
        const msg = `Invalid JSON from subscriptions endpoint (status ${response.status}). Body: ${text?.slice(0,200)}`
        log.error(msg)
        return { success: false, error: msg }
      }
      
      if (data.success) {
        // Refresh subscription data
        await fetchSubscription();

        // If a redirect URL is provided, handle it per-platform
        const redirectUrl = data.payment_url || data.approval_url;
        if (redirectUrl) {
          if (typeof window !== 'undefined') {
            try { (window as any).location.href = redirectUrl; } catch {}
          } else {
            try {
              await WebBrowser.openBrowserAsync(redirectUrl, {
                enableDefaultShareMenuItem: false,
                showTitle: true,
              });
            } catch (e) {
              // Fallback to system handler
              try { await Linking.openURL(redirectUrl); } catch {}
            }
          }
        }

        return {
          success: true,
          subscription_id: data.subscription_id,
          payment_url: data.payment_url,
          approval_url: data.approval_url,
          payment_id: data.payment_id
        };
      } else {
        setError(data.error || 'Failed to create subscription');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMessage = 'Network error while creating subscription';
      setError(errorMessage);
      log.error('Subscription creation error:', err as any);
      return { success: false, error: errorMessage };
    }
  }, [session, user, fetchSubscription]);

  // Refresh subscription data
  const refreshSubscription = useCallback(async () => {
    setLoading(true);
    await fetchSubscription();
    setLoading(false);
  }, [fetchSubscription]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (): Promise<boolean> => {
    if (!subscription || !session) return false;

    try {
      setError(null);
      // This would typically call a cancellation API endpoint
      // For now, we'll implement this as a placeholder
      
      // In a real implementation:
      // const response = await fetch(`/api/subscriptions/${subscription.id}/cancel`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${session.access_token}` }
      // });
      
      await refreshSubscription();
      return true;
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error('Subscription cancellation error:', err);
      return false;
    }
  }, [subscription, session, refreshSubscription]);

  // Helper functions
  const isSubscriptionActive = useCallback((): boolean => {
    if (!subscription) return false;
    // Trial is active only while within trial window
    if (subscription.status === 'trial') {
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null;
      return !!trialEnd && new Date() < trialEnd;
    }
    // Active requires at least one completed payment in the current period
    if (subscription.status === 'active') {
      return hasPaymentThisPeriod;
    }
    return false;
  }, [subscription, hasPaymentThisPeriod]);

  const isTrialActive = useCallback((): boolean => {
    if (!subscription || subscription.status !== 'trial') return false;
    if (!subscription.trial_end) return false;
    const trialEnd = new Date(subscription.trial_end);
    return new Date() < trialEnd;
  }, [subscription]);

  const getDaysUntilExpiry = useCallback((): number | null => {
    if (!subscription) return null;
    
    const expiryDate = subscription.trial_end 
      ? new Date(subscription.trial_end)
      : new Date(subscription.current_period_end);
    
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }, [subscription]);

  const canUpgrade = useCallback((targetTier: string): boolean => {
    if (!subscription) return true;
    
    const currentPlan = plans.find(p => p.id === subscription.plan_id);
    const targetPlan = plans.find(p => p.tier === targetTier);
    
    if (!currentPlan || !targetPlan) return false;
    
    return targetPlan.price_monthly > currentPlan.price_monthly;
  }, [subscription, plans]);

  const canDowngrade = useCallback((targetTier: string): boolean => {
    if (!subscription) return false;
    
    const currentPlan = plans.find(p => p.id === subscription.plan_id);
    const targetPlan = plans.find(p => p.tier === targetTier);
    
    if (!currentPlan || !targetPlan) return false;
    
    return targetPlan.price_monthly < currentPlan.price_monthly;
  }, [subscription, plans]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSubscription(), fetchPlans()]);
      setLoading(false);
    };

    loadData();
  }, [fetchSubscription, fetchPlans]);

  return {
    subscription,
    plans,
    loading,
    error,
    createSubscription,
    refreshSubscription,
    cancelSubscription,
    isSubscriptionActive,
    isTrialActive,
    getDaysUntilExpiry,
    canUpgrade,
    canDowngrade
  };
}
