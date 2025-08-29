# Subscription Flow Fix Documentation

## Current Issues

1. **Logged-in users see invitation code prompt** - Teachers/parents who are already logged in shouldn't be prompted for invitation codes
2. **Subscription creation fails** - The error shows the subscription creation endpoint is returning an error when users try to subscribe
3. **Flow confusion** - The system doesn't properly distinguish between:
   - New users who need accounts
   - Logged-in users who just need subscriptions
   - Users with invitation codes vs without

## Root Cause Analysis

The current flow in `app/pricing.tsx` has several logic issues:

1. **Line 276-308**: `handleInvitationCodeDecision` - Even for logged-in users, it's showing the invitation prompt
2. **Line 215-241**: When a logged-in non-principal selects a plan, it checks for invitation codes unnecessarily
3. **Subscription creation endpoint** returns errors because it's not properly configured or the request format is wrong

## Proposed Solution

### 1. Fix the Pricing Page Logic

```typescript
// For logged-in users, skip invitation code prompts entirely
const handleSelectPlan = async (plan: typeof pricingPlans[0]) => {
  setSelectedPlan(plan.id);

  // If user is logged in, go straight to payment
  if (isLoggedIn) {
    try {
      const result = await createSubscription({
        plan_id: plan.id,
        billing_interval: 'monthly',
        payment_provider: 'payfast',
      });
      
      if (result.success && !result.payment_url) {
        // Fallback for dev environments
        router.push('/payment/success/page');
      }
    } catch (e) {
      console.error('Subscription error:', e);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
    }
    return;
  }

  // Only show role modal for non-authenticated users
  setShowRoleModal(true);
};
```

### 2. Proper Flow Separation

**For Logged-In Users:**
1. Select Plan → Create Subscription → Payment

**For Non-Logged-In Users:**
1. Select Plan → Choose Role → Sign Up (with or without code) → Create Subscription → Payment

### 3. Fix Subscription Creation

The error suggests the subscription creation endpoint is failing. Need to:
1. Verify the API endpoint configuration
2. Check authentication headers
3. Ensure proper request payload format

## Implementation Steps

1. Update `app/pricing.tsx` to fix the flow logic
2. Remove unnecessary invitation code checks for logged-in users
3. Add proper error handling and user feedback
4. Test with different user states (logged out, logged in teacher, principal, etc.)
