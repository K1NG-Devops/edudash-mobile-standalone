// Supabase Edge Function: webhooks-paypal
// Minimal scaffold: Accepts PayPal webhook events and logs/updates subscriptions.

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const event = await req.json();
    const eventType = event?.event_type ?? 'unknown';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const subId = event?.resource?.id;
      if (subId) {
        await supabase
          .from('platform_subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('provider_subscription_id', subId);
      }
    } else if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const subId = event?.resource?.id;
      if (subId) {
        await supabase
          .from('platform_subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('provider_subscription_id', subId);
      }
    } else if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') {
      const subId = event?.resource?.id;
      if (subId) {
        await supabase
          .from('platform_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('provider_subscription_id', subId);
      }
    } else if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
      // Optional: record last payment failure in metadata
    } else if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED') {
      // Optional: insert into subscription_payments
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }
});

