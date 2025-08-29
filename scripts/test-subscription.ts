#!/usr/bin/env ts-node

/**
 * Test script to verify EduDash Pro subscription system
 * Usage: npx ts-node scripts/test-subscription.ts
 */

import { SubscriptionService } from '../lib/services/subscriptionService';
import { createLogger } from '../lib/utils/logger';

const log = createLogger('test-subscription');

async function testSubscriptionSystem() {
  
  try {
    // Test 1: Get subscription plans
    const plans = await SubscriptionService.getSubscriptionPlans();
    
    plans.forEach(plan => {
      log.info('Plan', {
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price_monthly: plan.price_monthly,
        currency: plan.currency,
      });
    });

    // Test 2: Get analytics (should work even with no subscriptions)
    const analytics = await SubscriptionService.getSubscriptionAnalytics();
    log.info('Analytics', {
      totalSubscriptions: analytics?.total_subscribers || 0,
      activeSubscriptions: analytics?.active_subscriptions || 0,
      monthlyRevenue: `R${analytics?.monthly_recurring_revenue || 0}`
    });

    // Test 3: Test plan lookup
    const freePlan = await SubscriptionService.getPlanByTier('free');
    if (freePlan) {
      log.info('Free plan lookup OK', { id: freePlan.id, tier: freePlan.tier });
    } else {
      log.warn('Free plan not found');
    }

    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  testSubscriptionSystem();
}
