// Supabase Edge Function: subscriptions-create
// Creates a platform subscription and returns a provider redirect URL
// Minimal scaffold – replace stubbed payment URL with real provider integration

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';
import { md5 } from 'https://deno.land/x/checksum@1.4.0/md5.ts';

// Standard CORS headers for browser requests
const corsHeaders: HeadersInit = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin'
};

type BillingInterval = 'monthly' | 'annual';

type CreateBody = {
  plan_id: string; // may be UUID, slug (e.g., "quantum-pro"), or display name
  billing_interval: BillingInterval;
  payment_provider: 'payfast' | 'paypal';
  return_url: string;
  cancel_url: string;
  notify_url: string;
  user_details?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
};

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapSlugToName(input: string): string {
  const lower = String(input || '').toLowerCase();
  const mapping: Record<string, string> = {
    'free-tier': 'Free Tier',
    'neural-starter': 'Neural Starter',
    'quantum-pro': 'Quantum Pro',
    'singularity': 'Enterprise',
    free: 'Free Tier',
    starter: 'Neural Starter',
    premium: 'Quantum Pro',
    enterprise: 'Enterprise',
  };
  return mapping[lower] || input;
}

function getTrialDaysByTier(tier?: string | null): number {
  const t = (tier || '').toLowerCase();
  if (t === 'starter' || t === 'premium') return 14;
  if (t === 'enterprise') return 30;
  return 0;
}

function getPayfastBaseUrl(): string {
  const env = Deno.env.get('PAYFAST_ENV') || Deno.env.get('EXPO_PUBLIC_PAYFAST_ENV') || 'sandbox';
  return env === 'production' ? 'https://www.payfast.co.za/eng/process' : 'https://sandbox.payfast.co.za/eng/process';
}

function generatePayFastSignature(params: Record<string, string>, passphrase?: string): string {
  // Remove empty fields and signature
  const filtered = Object.keys(params)
    .filter((k) => k !== 'signature' && params[k] !== '' && params[k] !== undefined && params[k] !== null)
    .sort()
    .reduce((acc: Record<string, string>, k) => { acc[k] = params[k]; return acc; }, {});

  // Build parameter string
  let paramString = Object.keys(filtered)
    .map((k) => `${k}=${encodeURIComponent(filtered[k])}`)
    .join('&');

  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase)}`;
  }

  // MD5 hash
  return md5(paramString);
}

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = (await req.json()) as CreateBody;
    let { plan_id, billing_interval, payment_provider, return_url, cancel_url, notify_url, user_details } = body || ({} as any);

    if (!plan_id || !billing_interval || !payment_provider || !return_url || !cancel_url || !notify_url) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Resolve the plan to a real subscription_plans row (ID & pricing)
    let planRow: any | null = null;
    if (uuidRegex.test(plan_id)) {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', plan_id)
        .maybeSingle();
      planRow = data ?? null;
    }
    if (!planRow) {
      const displayName = mapSlugToName(plan_id);
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', displayName)
        .maybeSingle();
      planRow = data ?? null;
    }
    if (!planRow) {
      // As a last resort try matching by tier
      const tierName = mapSlugToName(plan_id).toLowerCase();
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('tier', tierName)
        .maybeSingle();
      planRow = data ?? null;
    }

    if (!planRow) {
      return new Response(JSON.stringify({ success: false, error: 'Plan not found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const now = new Date();
    const trialDays = getTrialDaysByTier(planRow.tier);
    const trialEnd = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
    const periodStart = trialEnd || now;
    const periodEnd = new Date(periodStart);
    if (billing_interval === 'monthly') periodEnd.setMonth(periodEnd.getMonth() + 1);
    else periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    // Price from DB (no promo logic here to keep it simple on the edge)
    const price = billing_interval === 'monthly' ? (Number(planRow.price_monthly) || 0) : (Number(planRow.price_annual) || 0);

    // Create a payment id we can correlate in webhooks
    const paymentId = `edudash-${userData.user.id}-${Date.now()}`;

    // Insert subscription row first (RLS ensures user owns it)
    const { data: sub, error: subErr } = await supabase
      .from('platform_subscriptions')
      .insert({
        user_id: userData.user.id,
        plan_id: planRow.id,
        status: trialDays > 0 ? 'trial' : 'active',
        billing_interval,
        amount: price,
        currency: planRow.currency || 'ZAR',
        trial_start: trialDays > 0 ? now.toISOString() : null,
        trial_end: trialEnd ? trialEnd.toISOString() : null,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        payment_provider,
        provider_customer_id: null,
        metadata: {
          created_via: 'edge_function',
          notify_url,
          payment_id: paymentId,
        },
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select('*')
      .single();

    if (subErr || !sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create subscription', details: subErr?.message || subErr }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle provider redirect URL creation (PayFast default)
    let payment_url: string | undefined;
    if (payment_provider === 'payfast') {
      const merchant_id = Deno.env.get('PAYFAST_MERCHANT_ID') || '';
      const merchant_key = Deno.env.get('PAYFAST_MERCHANT_KEY') || '';
      const passphrase = Deno.env.get('PAYFAST_PASSPHRASE') || undefined;

      if (!merchant_id || !merchant_key) {
        // If credentials missing, still succeed but bounce through return_url so the UI proceeds in dev
        payment_url = `${return_url}?subscription_id=${encodeURIComponent(sub.id)}&provider=payfast&mock=1`;
      } else {
        const first = user_details?.first_name || 'User';
        const last = user_details?.last_name || 'Name';
        const email = user_details?.email || userData.user.email || 'user@example.com';

        const frequency = billing_interval === 'monthly' ? '3' : '6';
        const billingDate = new Date();
        if (trialDays > 0) billingDate.setDate(billingDate.getDate() + trialDays);

        const payload: Record<string, string> = {
          merchant_id,
          merchant_key,
          return_url,
          cancel_url,
          notify_url,
          name_first: first,
          name_last: last,
          email_address: email,
          m_payment_id: paymentId,
          amount: trialDays > 0 ? '0.00' : (Number(price || 0).toFixed(2)),
          item_name: `EduDash Pro ${planRow.name}`,
          item_description: `${planRow.name} subscription - ${billing_interval} billing`,
          subscription_type: '1',
          billing_date: billingDate.toISOString().split('T')[0],
          recurring_amount: Number(price || 0).toFixed(2),
          frequency,
          cycles: '0',
        };

        const signature = generatePayFastSignature(payload, passphrase);
        const params = new URLSearchParams();
        Object.entries(payload).forEach(([k, v]) => params.append(k, v));
        params.append('signature', signature);

        payment_url = `${getPayfastBaseUrl()}?${params.toString()}`;
      }
    }

    return new Response(
      JSON.stringify({ success: true, subscription_id: sub.id, payment_url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

