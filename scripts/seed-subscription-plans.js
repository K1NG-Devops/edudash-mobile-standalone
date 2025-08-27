// scripts/seed-subscription-plans.js
// Idempotent seed for subscription_plans via Supabase REST
// - Uses service role key from env (never printed)
// - Gated by ALLOW_SERVICE_SEED=true to avoid accidental runs
// - Upserts by primary key id with Prefer: resolution=merge-duplicates

(async () => {
  try {
    // Load env files if present
    try { require('dotenv').config({ path: '.env.local' }); } catch {}
    try { require('dotenv').config({ path: '.env' }); } catch {}
    try { require('dotenv').config({ path: '.env.production' }); } catch {}

    if (process.env.ALLOW_SERVICE_SEED !== 'true') {
      console.error('Refusing to run without ALLOW_SERVICE_SEED=true');
      process.exit(2);
    }

    const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error('Missing Supabase URL or service role key in env');
      process.exit(2);
    }

    // Deterministic UUIDs for idempotency
    const plans = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Free Tier',
        price_monthly: 0,
        price_annual: 0,
        features: [
          'Basic lessons',
          'Up to 3 students',
          'Parent-teacher messaging',
          'Mobile app access',
          'Ads on non-learning pages'
        ],
ai_quota_monthly: 5,
        max_students: 3,
        max_teachers: 1,
        is_active: true,
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Neural Starter',
        price_monthly: 49.0,
        price_annual: Math.round(49 * 12 * 0.83 * 100) / 100,
        features: [
'25 AI lessons per month',
          'Up to 15 students',
          'Advanced progress tracking',
          'Parent-teacher messaging',
          'No ads'
        ],
ai_quota_monthly: 25,
        max_students: 15,
        max_teachers: 3,
        is_active: true,
      },
      {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Quantum Pro',
        price_monthly: 299.0,
        price_annual: Math.round(299 * 12 * 0.83 * 100) / 100,
        features: [
          'Unlimited AI lesson generation',
          'Up to 50 students',
          'Advanced analytics & insights',
          'AI homework grading',
          'Custom school branding'
        ],
        ai_quota_monthly: null,
        max_students: 50,
        max_teachers: null,
        is_active: true,
      },
      {
        id: '44444444-4444-4444-8444-444444444444',
        name: 'Singularity',
        price_monthly: 999.0,
        price_annual: Math.round(999 * 12 * 0.83 * 100) / 100,
        features: [
          'Unlimited everything',
          'Multi-school management',
          'Advanced AI tutoring',
          'Predictive analytics',
          'Enterprise security'
        ],
        ai_quota_monthly: null,
        max_students: null,
        max_teachers: null,
        is_active: true,
      },
    ];

    const endpoint = `${url}/rest/v1/subscription_plans?on_conflict=id`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(plans),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('Upsert failed:', res.status, txt);
      process.exit(1);
    }

    const upserted = await res.json();

    // Verify using anon key if available, else service
    const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || serviceKey;
    const verifyRes = await fetch(`${url}/rest/v1/subscription_plans?select=id,name,is_active,price_monthly,price_annual&is_active=eq.true&order=price_monthly.asc`, {
      headers: { apikey: anon, Authorization: `Bearer ${anon}` },
    });
    const verify = await verifyRes.json();

    // Safe output (no secrets)
    console.log(JSON.stringify({
      upserted_count: Array.isArray(upserted) ? upserted.length : -1,
      active_count: Array.isArray(verify) ? verify.length : -1,
      active: (verify || []).map(p => ({ id: p.id, name: p.name, price_monthly: p.price_monthly, price_annual: p.price_annual })),
    }, null, 2));
  } catch (e) {
    console.error('Seed failed:', e?.message || e);
    process.exit(1);
  }
})();

