import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService, PayPalWebhookEvent } from '@/lib/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event: PayPalWebhookEvent = body;

    // Validate required fields
    if (!event.id || !event.event_type || !event.resource) {
      console.error('PayPal webhook missing required fields:', event);
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the webhook for debugging (remove sensitive data in production)
      id: event.id,
      event_type: event.event_type,
      resource_type: event.resource_type,
      create_time: event.create_time,
      // Don't log the full resource object as it may contain sensitive data
      resource_id: event.resource?.id
    });

    // Validate webhook signature if needed (recommended for production)
    // const webhookSignature = request.headers.get('PAYPAL-TRANSMISSION-SIG');
    // const isValidSignature = await validatePayPalWebhookSignature(event, webhookSignature);
    // if (!isValidSignature) {
    //   return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    // }

    // Process the webhook
    const success = await SubscriptionService.handleWebhook('paypal', event);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      console.error('PayPal webhook processing failed:', event.id);
      return NextResponse.json(
        { success: false, error: 'Webhook processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle webhook validation requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // PayPal webhook validation - echo back the challenge
    return NextResponse.json({ challenge });
  }

  // Return endpoint status
  return NextResponse.json({ 
    status: 'PayPal webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}
