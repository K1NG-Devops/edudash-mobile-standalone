import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService, CreateSubscriptionRequest } from '@/lib/services/subscriptionService';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Supabase Auth
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      plan_id,
      billing_interval,
      payment_provider,
      return_url,
      cancel_url,
      notify_url,
      user_details
    } = body;

    // Validate required fields
    if (!plan_id || !billing_interval || !payment_provider) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: plan_id, billing_interval, payment_provider' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await SubscriptionService.getUserSubscription(session.user.id);
    if (existingSubscription) {
      return NextResponse.json(
        { success: false, error: 'User already has an active subscription' },
        { status: 409 }
      );
    }

    // Create subscription record in database
    const subscriptionRequest: CreateSubscriptionRequest = {
      user_id: session.user.id,
      plan_id,
      billing_interval,
      payment_provider,
      metadata: {
        created_via: 'web_api',
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        ...user_details
      }
    };

    const subscription = await SubscriptionService.createSubscription(subscriptionRequest);
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Failed to create subscription' },
        { status: 500 }
      );
    }

    // Handle different payment providers
    let paymentResponse: any = null;

    if (payment_provider === 'payfast') {
      if (!return_url || !cancel_url || !notify_url || !user_details) {
        return NextResponse.json(
          { success: false, error: 'PayFast requires return_url, cancel_url, notify_url, and user_details' },
          { status: 400 }
        );
      }

      paymentResponse = await SubscriptionService.createPayFastSubscription({
        ...subscriptionRequest,
        return_url,
        cancel_url,
        notify_url,
        user_details: {
          first_name: user_details.first_name || session.user.user_metadata?.first_name || 'User',
          last_name: user_details.last_name || session.user.user_metadata?.last_name || 'Name',
          email: user_details.email || session.user.email || 'user@example.com'
        }
      });

      if (!paymentResponse) {
        return NextResponse.json(
          { success: false, error: 'Failed to create PayFast subscription' },
          { status: 500 }
        );
      }

      // Update subscription with PayFast payment ID
      await SubscriptionService.updateSubscriptionStatus(
        subscription.id,
        subscription.status,
        { 
          ...subscription.metadata,
          payment_id: paymentResponse.payment_id,
          payment_url: paymentResponse.payment_url
        }
      );

      return NextResponse.json({
        success: true,
        subscription_id: subscription.id,
        payment_url: paymentResponse.payment_url,
        payment_id: paymentResponse.payment_id,
        provider: 'payfast'
      });
    }

    if (payment_provider === 'paypal') {
      if (!return_url || !cancel_url) {
        return NextResponse.json(
          { success: false, error: 'PayPal requires return_url and cancel_url' },
          { status: 400 }
        );
      }

      // First create PayPal plan
      const plan = await SubscriptionService.getSubscriptionPlan(plan_id);
      if (!plan) {
        return NextResponse.json(
          { success: false, error: 'Subscription plan not found' },
          { status: 404 }
        );
      }

      const paypalPlanId = await SubscriptionService.createPayPalPlan(plan, billing_interval);
      if (!paypalPlanId) {
        return NextResponse.json(
          { success: false, error: 'Failed to create PayPal plan' },
          { status: 500 }
        );
      }

      paymentResponse = await SubscriptionService.createPayPalSubscription({
        ...subscriptionRequest,
        paypal_plan_id: paypalPlanId,
        return_url,
        cancel_url
      });

      if (!paymentResponse) {
        return NextResponse.json(
          { success: false, error: 'Failed to create PayPal subscription' },
          { status: 500 }
        );
      }

      // Update subscription with PayPal subscription ID
      await SubscriptionService.updateSubscriptionStatus(
        subscription.id,
        subscription.status,
        { 
          ...subscription.metadata,
          paypal_plan_id: paypalPlanId,
          paypal_subscription_id: paymentResponse.subscription_id
        }
      );

      return NextResponse.json({
        success: true,
        subscription_id: subscription.id,
        approval_url: paymentResponse.approval_url,
        paypal_subscription_id: paymentResponse.subscription_id,
        provider: 'paypal'
      });
    }

    return NextResponse.json(
      { success: false, error: `Unsupported payment provider: ${payment_provider}` },
      { status: 400 }
    );

  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user's current subscription
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const subscription = await SubscriptionService.getUserSubscription(session.user.id);
    
    return NextResponse.json({
      success: true,
      subscription
    });

  } catch (error) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
