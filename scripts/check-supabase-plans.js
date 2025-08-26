// check-supabase-plans.js
// Loads env from .env.local/.env.production/.env and queries public subscription_plans via REST
(async () => {
  try {
    try { require('dotenv').config({ path: '.env.local' }); } catch {}
    try { require('dotenv').config({ path: '.env.production' }); } catch {}
    try { require('dotenv').config({ path: '.env' }); } catch {}

    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      console.error('Missing Supabase env vars (EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY).');
      process.exit(2);
    }

    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/subscription_plans?select=id,tier,is_active,price_monthly,price_annual,currency&is_active=eq.true`;
    const res = await fetch(endpoint, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const json = await res.json();

    // Only print safe summary and rows (no secrets)
    const out = {
      count: Array.isArray(json) ? json.length : -1,
      rows: json,
    };
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('Failed to query subscription_plans:', e?.message || e);
    process.exit(1);
  }
})();

