// Supabase Edge Function: webhooks-payfast
// Validates PayFast ITN signature and updates subscription status

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Md5 } from 'https://deno.land/std@0.223.0/hash/md5.ts';

function md5(input: string): string {
  return new Md5().update(input).toString();
}

function buildSignaturePayload(params: Record<string, string>, passphrase?: string) {
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'signature' && params[k] !== undefined && params[k] !== '')
    .sort();
  const paramString = sortedKeys.map(k => `${k}=${encodeURIComponent(params[k])}`).join('&');
  return passphrase ? `${paramString}&passphrase=${encodeURIComponent(passphrase)}` : paramString;
}

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const contentType = req.headers.get('content-type') || '';
    const text = await req.text();

    let params: Record<string, string> = {};
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const usp = new URLSearchParams(text);
      usp.forEach((v, k) => { params[k] = v; });
    } else {
      // Try JSON fallback
      try {
        params = JSON.parse(text);
      } catch {
        return new Response('Invalid payload', { status: 400 });
      }
    }

    const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') || '';
    const merchantId = Deno.env.get('PAYFAST_MERCHANT_ID') || '';

    // Validate merchant
    if (merchantId && params['merchant_id'] && params['merchant_id'] !== merchantId) {
      return new Response('Invalid merchant', { status: 400 });
    }

    // Validate signature
    const payload = buildSignaturePayload(params, passphrase);
    const expected = md5(payload);
    const provided = (params['signature'] || '').toLowerCase();
    if (!expected || expected !== provided) {
      return new Response('Invalid signature', { status: 400 });
    }

    // Update subscription status & insert payment record
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRole = Deno.env.get('SERVER_SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRole) {
      return new Response('Missing service role key', { status: 500 });
    }
    const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

    const paymentStatus = params['payment_status'] || '';
    const mPaymentId = params['m_payment_id'] || '';
    const pfPaymentId = params['pf_payment_id'] || '';

    if (!mPaymentId) {
      return new Response('Missing payment id', { status: 400 });
    }

    let subStatus: 'active' | 'past_due' | 'trial' = 'trial';
    if (paymentStatus === 'COMPLETE') subStatus = 'active';
    else if (paymentStatus === 'FAILED') subStatus = 'past_due';

    const { error } = await admin
      .from('platform_subscriptions')
      .update({
        status: subStatus,
        provider_subscription_id: pfPaymentId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('metadata->>payment_id', mPaymentId);

    if (error) {
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }

    // Look up subscription id for payments FK
    const { data: subRow } = await admin
      .from('platform_subscriptions')
      .select('id')
      .eq('metadata->>payment_id', mPaymentId)
      .maybeSingle();

    // Map PayFast status to our allowed payment statuses
    const mapStatus = (s: string): 'completed' | 'pending' | 'failed' | 'refunded' => {
      switch (s.toUpperCase()) {
        case 'COMPLETE':
          return 'completed';
        case 'PENDING':
          return 'pending';
        case 'FAILED':
          return 'failed';
        case 'REFUNDED':
          return 'refunded';
        default:
          return 'pending';
      }
    };

    // Insert payment row (best-effort)
    try {
      if (subRow?.id) {
        const amount = paymentStatus === 'COMPLETE' ? Number(params['amount_net'] || params['amount_gross'] || 0) : Number(params['amount_gross'] || 0);
        const processedAt = params['billing_date'] || new Date().toISOString();
        await admin
          .from('subscription_payments')
          .insert({
            subscription_id: subRow.id,
            amount,
            currency: 'ZAR',
            status: mapStatus(paymentStatus),
            provider_payment_id: pfPaymentId || null,
            processed_at: processedAt,
            metadata: { payfast: params },
          });
      }
    } catch (_) {
      // non-fatal
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }
});

