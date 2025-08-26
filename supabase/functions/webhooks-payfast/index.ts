// Supabase Edge Function: webhooks-payfast
// Validates PayFast ITN signature and updates subscription status

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function md5(input: string): string {
  const data = new TextEncoder().encode(input);
  const hashBuffer = (globalThis as any).crypto.subtle.digestSync?.('MD5', data);
  if (hashBuffer) {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback: not available in all runtimes
  return '';
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

    // Update subscription status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    const paymentStatus = params['payment_status'] || '';
    const mPaymentId = params['m_payment_id'] || '';
    const pfPaymentId = params['pf_payment_id'] || '';

    if (!mPaymentId) {
      return new Response('Missing payment id', { status: 400 });
    }

    let status: 'active' | 'past_due' | 'trial' = 'trial';
    if (paymentStatus === 'COMPLETE') status = 'active';
    else if (paymentStatus === 'FAILED') status = 'past_due';

    const { error } = await supabase
      .from('platform_subscriptions')
      .update({
        status,
        provider_subscription_id: pfPaymentId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('metadata->>payment_id', mPaymentId);

    if (error) {
      return new Response(`DB error: ${error.message}`, { status: 500 });
    }

    return new Response('OK', { status: 200 });
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 });
  }
});

