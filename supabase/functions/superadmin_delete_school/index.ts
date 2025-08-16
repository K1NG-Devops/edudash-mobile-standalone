import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Missing auth token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json({ error: "Service configuration missing" }, 500);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: tokenUser, error: tokenErr } = await admin.auth.getUser(token);
    if (tokenErr || !tokenUser?.user) return json({ error: "Invalid token" }, 401);

    const authUserId = tokenUser.user.id;
    const { data: caller } = await admin
      .from("users")
      .select("id, role, is_active")
      .eq("auth_user_id", authUserId)
      .single();
    if (!caller || caller.role !== "superadmin" || !caller.is_active) return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const schoolId: string | undefined = body?.schoolId;
    const requestId: string | undefined = body?.requestId;
    if (!schoolId) return json({ error: "schoolId is required" }, 400);

    // Get auth users for this school
    const { data: schoolUsers, error: usersErr } = await admin
      .from("users")
      .select("auth_user_id")
      .eq("preschool_id", schoolId);
    if (usersErr) return json({ error: usersErr.message }, 500);

    const authIds = (schoolUsers || [])
      .map((u) => u.auth_user_id)
      .filter((id): id is string => !!id);

    // Delete Auth users first
    for (const uid of authIds) {
      await admin.auth.admin.deleteUser(uid);
    }

    // Delete tenant data (extend this as more tables are added)
    const tables = [
      "students",
      "classes",
      "messages",
      "lessons",
      "activities",
      "users",
    ];
    for (const t of tables) {
      await admin.from(t).delete().eq("preschool_id", schoolId);
    }

    // Delete the school
    await admin.from("preschools").delete().eq("id", schoolId);

    // Optionally delete onboarding request
    if (requestId) {
      await admin.from("preschool_onboarding_requests").delete().eq("id", requestId);
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}


