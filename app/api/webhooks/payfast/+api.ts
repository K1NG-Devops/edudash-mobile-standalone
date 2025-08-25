import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionService, PayFastNotification } from '@/lib/services/subscriptionService';

export async function POST(request: NextRequest) {
  try {
    // PayFast sends data as form-encoded
    const formData = await request.formData();
    const notification: PayFastNotification = {
      m_payment_id: formData.get('m_payment_id') as string,
      pf_payment_id: formData.get('pf_payment_id') as string,
      payment_status: formData.get('payment_status') as 'COMPLETE' | 'FAILED' | 'PENDING',
      item_name: formData.get('item_name') as string,
      item_description: formData.get('item_description') as string,
      amount_gross: formData.get('amount_gross') as string,
      amount_fee: formData.get('amount_fee') as string,
      amount_net: formData.get('amount_net') as string,
      custom_str1: formData.get('custom_str1') as string || undefined,
      custom_str2: formData.get('custom_str2') as string || undefined,
      custom_str3: formData.get('custom_str3') as string || undefined,
      custom_str4: formData.get('custom_str4') as string || undefined,
      custom_str5: formData.get('custom_str5') as string || undefined,
      custom_int1: formData.get('custom_int1') as string || undefined,
      custom_int2: formData.get('custom_int2') as string || undefined,
      custom_int3: formData.get('custom_int3') as string || undefined,
      custom_int4: formData.get('custom_int4') as string || undefined,
      custom_int5: formData.get('custom_int5') as string || undefined,
      name_first: formData.get('name_first') as string,
      name_last: formData.get('name_last') as string,
      email_address: formData.get('email_address') as string,
      merchant_id: formData.get('merchant_id') as string,
      token: formData.get('token') as string,
      billing_date: formData.get('billing_date') as string,
      signature: formData.get('signature') as string,
    };

    // Validate required fields
    if (!notification.m_payment_id || !notification.pf_payment_id || !notification.payment_status || !notification.signature) {
      console.error('PayFast webhook missing required fields:', notification);
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Log the webhook for debugging (remove in production)
      m_payment_id: notification.m_payment_id,
      pf_payment_id: notification.pf_payment_id,
      payment_status: notification.payment_status,
      amount_gross: notification.amount_gross,
      merchant_id: notification.merchant_id
    });

    // Process the webhook
    const success = await SubscriptionService.handleWebhook('payfast', notification);

    if (success) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      console.error('PayFast webhook processing failed:', notification.pf_payment_id);
      return NextResponse.json(
        { success: false, error: 'Webhook processing failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('PayFast webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PayFast also sends GET requests to validate the webhook URL
export async function GET(request: NextRequest) {
  // Return a simple response to confirm the endpoint is active
  return NextResponse.json({ 
    status: 'PayFast webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}
