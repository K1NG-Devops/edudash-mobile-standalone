// check-supabase-plans-min.js
(async () => {
  try {
    try { require('dotenv').config({ path: '.env.local' }); } catch {}
    try { require('dotenv').config({ path: '.env.production' }); } catch {}
    try { require('dotenv').config({ path: '.env' }); } catch {}
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) { console.error('Missing Supabase env vars'); process.exit(2); }
    const endpoint = `${url.replace(/\/$/, '')}/rest/v1/subscription_plans?select=id,name,is_active,price_monthly,price_annual&is_active=eq.true`;
    const res = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    const json = await res.json();
    console.log(JSON.stringify({ count: Array.isArray(json) ? json.length : -1, rows: json }, null, 2));
  } catch (e) { console.error('Failed to query:', e?.message || e); process.exit(1); }
})();

