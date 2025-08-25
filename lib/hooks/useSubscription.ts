import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SimpleWorkingAuth';
import { SubscriptionService } from '@/lib/services/subscriptionService';
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
      
      const requestBody = {
        plan_id: params.plan_id,
        billing_interval: params.billing_interval,
        payment_provider: params.payment_provider,
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        notify_url: `${window.location.origin}/api/webhooks/${params.payment_provider}`,
        user_details: {
          first_name: params.user_details?.first_name || user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0] || 'User',
          last_name: params.user_details?.last_name || user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' ') || 'Name',
          email: params.user_details?.email || user.email || 'user@example.com'
        }
      };

      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh subscription data
        await fetchSubscription();
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
      console.error('Subscription creation error:', err);
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
    return subscription?.status === 'active' || subscription?.status === 'trial';
  }, [subscription]);

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
