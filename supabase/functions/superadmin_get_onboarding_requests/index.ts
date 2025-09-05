// Supabase Edge Function: superadmin_get_onboarding_requests
// Returns all onboarding requests for superadmins (service role on server)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Verify token and role using service role on server
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Missing auth token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Service configuration missing" }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Validate user and require superadmin
    const { data: tokenUser, error: tokenErr } = await admin.auth.getUser(token);
    if (tokenErr || !tokenUser?.user) return json({ error: "Invalid token" }, 401);

    const authUserId = tokenUser.user.id;
    const { data: caller } = await admin
      .from("users")
      .select("id, role, is_active")
      .eq("auth_user_id", authUserId)
      .single();
    if (!caller || caller.role !== "superadmin" || caller.is_active === false) {
      return json({ error: "Forbidden" }, 403);
    }

    // Return all requests
    const { data: requests, error } = await admin
      .from("preschool_onboarding_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);

    return json({ requests });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}

