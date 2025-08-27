// Supabase Edge Function: subscriptions-create
// Creates a platform subscription and returns a provider redirect URL
// Minimal scaffold – replace stubbed payment URL with real provider integration

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts';

function isOriginAllowed(origin: string, allowedList: string[]): boolean {
  // Exact match
  if (allowedList.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const host = url.host; // e.g., foo.vercel.app
    const protocol = url.protocol; // e.g., https:

    for (const entry of allowedList) {
      // Support entries like https://*.vercel.app or http://localhost:8081
      if (entry.includes('*')) {
        // Split into protocol and host pattern
        const [entryProtocol, entryHost] = entry.split('://');
        if (entryProtocol && entryHost) {
          if (entryProtocol + ':' !== protocol) continue;
          // Only support prefix wildcard: *.domain.tld
          if (entryHost.startsWith('*.')) {
            const suffix = entryHost.slice(2); // remove *.
            if (host === suffix || host.endsWith('.' + suffix)) {
              return true;
            }
          }
        }
      }
    }
  } catch {
    // If origin is not a valid URL, fall back to exact comparison only
  }
  return false;
}

function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowOrigin = origin && isOriginAllowed(origin, allowed)
    ? origin
    : (allowed.length === 0 ? '*' : '');

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }

  return headers;
}

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

// Lightweight MD5 implementation (pure TS, no remote imports)
// Adapted from public domain/CC implementations used widely in browsers
function md5Hex(input: string): string {
  function toUtf8(s: string): string {
    return unescape(encodeURIComponent(s))
  }
  function rhex(n: number): string {
    const hex = '0123456789abcdef'
    let s = ''
    for (let j = 0; j < 4; j++) s += hex.charAt((n >> (j * 8 + 4)) & 0x0f) + hex.charAt((n >> (j * 8)) & 0x0f)
    return s
  }
  function add(x: number, y: number) {
    return (((x & 0xffff) + (y & 0xffff)) | 0) + ((((x >>> 16) + (y >>> 16)) & 0xffff) << 16)
  }
  function rol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt))
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return add(rol(add(add(a, q), add(x, t)), s), b)
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t)
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t)
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t)
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t)
  }
  function binl(s: string) {
    const str = toUtf8(s)
    const n = str.length
    const x = new Array<number>(((n + 8) >> 6) + 1)
    for (let i = 0; i < x.length; i++) x[i] = 0
    for (let i = 0; i < n; i++) x[i >> 2] |= str.charCodeAt(i) << ((i % 4) * 8)
    x[n >> 2] |= 0x80 << ((n % 4) * 8)
    x[((n + 8) >> 6) * 16 + 14] = n * 8

    let a = 1732584193
    let b = -271733879
    let c = -1732584194
    let d = 271733878

    for (let i = 0; i < x.length; i += 16) {
      const olda = a, oldb = b, oldc = c, oldd = d

      a = ff(a, b, c, d, x[i + 0], 7, -680876936)
      d = ff(d, a, b, c, x[i + 1], 12, -389564586)
      c = ff(c, d, a, b, x[i + 2], 17, 606105819)
      b = ff(b, c, d, a, x[i + 3], 22, -1044525330)
      a = ff(a, b, c, d, x[i + 4], 7, -176418897)
      d = ff(d, a, b, c, x[i + 5], 12, 1200080426)
      c = ff(c, d, a, b, x[i + 6], 17, -1473231341)
      b = ff(b, c, d, a, x[i + 7], 22, -45705983)
      a = ff(a, b, c, d, x[i + 8], 7, 1770035416)
      d = ff(d, a, b, c, x[i + 9], 12, -1958414417)
      c = ff(c, d, a, b, x[i + 10], 17, -42063)
      b = ff(b, c, d, a, x[i + 11], 22, -1990404162)
      a = ff(a, b, c, d, x[i + 12], 7, 1804603682)
      d = ff(d, a, b, c, x[i + 13], 12, -40341101)
      c = ff(c, d, a, b, x[i + 14], 17, -1502002290)
      b = ff(b, c, d, a, x[i + 15], 22, 1236535329)

      a = gg(a, b, c, d, x[i + 1], 5, -165796510)
      d = gg(d, a, b, c, x[i + 6], 9, -1069501632)
      c = gg(c, d, a, b, x[i + 11], 14, 643717713)
      b = gg(b, c, d, a, x[i + 0], 20, -373897302)
      a = gg(a, b, c, d, x[i + 5], 5, -701558691)
      d = gg(d, a, b, c, x[i + 10], 9, 38016083)
      c = gg(c, d, a, b, x[i + 15], 14, -660478335)
      b = gg(b, c, d, a, x[i + 4], 20, -405537848)
      a = gg(a, b, c, d, x[i + 9], 5, 568446438)
      d = gg(d, a, b, c, x[i + 14], 9, -1019803690)
      c = gg(c, d, a, b, x[i + 3], 14, -187363961)
      b = gg(b, c, d, a, x[i + 8], 20, 1163531501)
      a = gg(a, b, c, d, x[i + 13], 5, -1444681467)
      d = gg(d, a, b, c, x[i + 2], 9, -51403784)
      c = gg(c, d, a, b, x[i + 7], 14, 1735328473)
      b = gg(b, c, d, a, x[i + 12], 20, -1926607734)

      a = hh(a, b, c, d, x[i + 5], 4, -378558)
      d = hh(d, a, b, c, x[i + 8], 11, -2022574463)
      c = hh(c, d, a, b, x[i + 11], 16, 1839030562)
      b = hh(b, c, d, a, x[i + 14], 23, -35309556)
      a = hh(a, b, c, d, x[i + 1], 4, -1530992060)
      d = hh(d, a, b, c, x[i + 4], 11, 1272893353)
      c = hh(c, d, a, b, x[i + 7], 16, -155497632)
      b = hh(b, c, d, a, x[i + 10], 23, -1094730640)
      a = hh(a, b, c, d, x[i + 13], 4, 681279174)
      d = hh(d, a, b, c, x[i + 0], 11, -358537222)
      c = hh(c, d, a, b, x[i + 3], 16, -722521979)
      b = hh(b, c, d, a, x[i + 6], 23, 76029189)
      a = hh(a, b, c, d, x[i + 9], 4, -640364487)
      d = hh(d, a, b, c, x[i + 12], 11, -421815835)
      c = hh(c, d, a, b, x[i + 15], 16, 530742520)
      b = hh(b, c, d, a, x[i + 2], 23, -995338651)

      a = ii(a, b, c, d, x[i + 0], 6, -198630844)
      d = ii(d, a, b, c, x[i + 7], 10, 1126891415)
      c = ii(c, d, a, b, x[i + 14], 15, -1416354905)
      b = ii(b, c, d, a, x[i + 5], 21, -57434055)
      a = ii(a, b, c, d, x[i + 12], 6, 1700485571)
      d = ii(d, a, b, c, x[i + 3], 10, -1894986606)
      c = ii(c, d, a, b, x[i + 10], 15, -1051523)
      b = ii(b, c, d, a, x[i + 1], 21, -2054922799)
      a = ii(a, b, c, d, x[i + 8], 6, 1873313359)
      d = ii(d, a, b, c, x[i + 15], 10, -30611744)
      c = ii(c, d, a, b, x[i + 6], 15, -1560198380)
      b = ii(b, c, d, a, x[i + 13], 21, 1309151649)
      a = ii(a, b, c, d, x[i + 4], 6, -145523070)
      d = ii(d, a, b, c, x[i + 11], 10, -1120210379)
      c = ii(c, d, a, b, x[i + 2], 15, 718787259)
      b = ii(b, c, d, a, x[i + 9], 21, -343485551)

      a = add(a, olda)
      b = add(b, oldb)
      c = add(c, oldc)
      d = add(d, oldd)
    }
    return rhex(a) + rhex(b) + rhex(c) + rhex(d)
  }
  return binl(input)
}

function generatePayFastSignature(params: Record<string, string>, passphrase: string | undefined, md5: (input: string) => string): string {
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
  const origin = req.headers.get('Origin');
  const corsHeaders = buildCorsHeaders(origin);

  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
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

        // Use inline md5 implementation to avoid remote imports issues
        const signature = generatePayFastSignature(payload, passphrase, md5Hex);
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

