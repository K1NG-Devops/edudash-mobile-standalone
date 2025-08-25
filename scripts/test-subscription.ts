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
    });

    // Test 2: Get analytics (should work even with no subscriptions)
    const analytics = await SubscriptionService.getSubscriptionAnalytics();
      totalSubscriptions: analytics?.total_subscribers || 0,
      activeSubscriptions: analytics?.active_subscriptions || 0,
      monthlyRevenue: `R${analytics?.monthly_recurring_revenue || 0}`
    });

    // Test 3: Test plan lookup
    const freePlan = await SubscriptionService.getPlanByTier('free');
    if (freePlan) {
    } else {
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
