// Supabase Edge Function: notify-user
// Creates a notification for a given users.id. Intended for server/automation usage.
// Security: requires header `X-Edudash-Token` to match env `NOTIFY_FUNCTION_TOKEN`.
// Body: { user_id: string, title: string, message: string, type?: 'info'|'success'|'warning'|'error'|'activity', action_url?: string }

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, X-Edudash-Token",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const NOTIFY_FUNCTION_TOKEN = Deno.env.get("SERVER_NOTIFY_FUNCTION_TOKEN") || Deno.env.get("NOTIFY_FUNCTION_TOKEN");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Service not configured" }, 500);

    // Simple shared-secret check
    const token = req.headers.get("X-Edudash-Token");
    if (!NOTIFY_FUNCTION_TOKEN || token !== NOTIFY_FUNCTION_TOKEN) {
      return json({ error: "Unauthorized" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const body = await req.json();
    const user_id = String(body?.user_id || '').trim();
    const title = String(body?.title || '').trim();
    const message = String(body?.message || '').trim();
    const type = (body?.type || 'info') as 'info'|'success'|'warning'|'error'|'activity';
    const action_url = body?.action_url ? String(body.action_url) : null;

    if (!user_id || !title || !message) {
      return json({ error: "Missing required fields (user_id, title, message)" }, 400);
    }

    // Validate the target user exists
    const { data: userRow, error: userErr } = await admin
      .from('users')
      .select('id')
      .eq('id', user_id)
      .maybeSingle();

    if (userErr) return json({ error: userErr.message }, 500);
    if (!userRow) return json({ error: "User not found" }, 404);

    // Insert notification
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

