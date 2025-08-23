// Supabase Edge Function: notify-user-auth
// Creates a notification for a given users.id, authorized by the caller's Supabase session.
// Only callers whose user profile (users table) has role in allowedRoles can create notifications.
// Body: { user_id: string, title: string, message: string, type?: 'info'|'success'|'warning'|'error'|'activity', action_url?: string }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const allowedRoles = new Set(["superadmin", "preschool_admin", "principal"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return json({ error: "Service not configured" }, 500);

    // Use caller's auth header to perform RLS-authorized queries
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    // Who is calling?
    const { data: authUser, error: authe } = await client.auth.getUser();
    if (authe || !authUser?.user) return json({ error: "Unauthorized" }, 401);

    const auth_user_id = authUser.user.id;

    // Load profile and validate role
    const { data: me, error: meErr } = await client
      .from('users')
      .select('id, role, preschool_id')
      .eq('auth_user_id', auth_user_id)
      .maybeSingle();

    if (meErr) return json({ error: meErr.message }, 500);
    if (!me || !allowedRoles.has(me.role)) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const user_id = String(body?.user_id || '').trim();
    const title = String(body?.title || '').trim();
    const message = String(body?.message || '').trim();
    const type = (body?.type || 'info') as 'info'|'success'|'warning'|'error'|'activity';
    const action_url = body?.action_url ? String(body.action_url) : null;

    if (!user_id || !title || !message) {
      return json({ error: "Missing required fields (user_id, title, message)" }, 400);
    }

    // Optional: scope check – principals may only notify users within the same preschool
    if (me.role !== 'superadmin' && me.preschool_id) {
      const { data: target, error: tErr } = await client
        .from('users')
        .select('id, preschool_id')
        .eq('id', user_id)
        .maybeSingle();
      if (tErr) return json({ error: tErr.message }, 500);
      if (!target || target.preschool_id !== me.preschool_id) return json({ error: 'Target outside of scope' }, 403);
    }

    // Insert notification using service role to avoid client RLS restrictions on writes,
    // but only after we have validated the caller via RLS.
    const SERVICE_ROLE_KEY = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SERVICE_ROLE_KEY) return json({ error: "Service role missing" }, 500);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { error: insErr } = await admin
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type,
        is_read: false,
        action_url: action_url,
        created_at: new Date().toISOString(),
      } as any);

    if (insErr) return json({ error: insErr.message }, 500);

    return json({ success: true });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

