// Supabase Edge Function: platform-stats
// Returns privileged platform-wide statistics using service role

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Missing service configuration" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Count schools
    const { count: total_schools, error: schoolErr } = await admin
      .from("preschools")
      .select("*", { count: "exact", head: true });
    if (schoolErr) throw schoolErr;

    // Count users
    const { count: total_users, error: usersErr } = await admin
      .from("users")
      .select("*", { count: "exact", head: true });
    if (usersErr) throw usersErr;

    // Count students
    const { count: total_students, error: studentsErr } = await admin
      .from("students")
      .select("*", { count: "exact", head: true });
    if (studentsErr) throw studentsErr;

    // Count teachers / parents by role
    const { data: rolesData, error: rolesErr } = await admin
      .from("users")
      .select("role");
    if (rolesErr) throw rolesErr;
    const roleCounts = (rolesData ?? []).reduce(
      (acc: Record<string, number>, u: any) => {
        const r = u.role || "unknown";
        acc[r] = (acc[r] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Active subscriptions
    const { count: active_subscriptions, error: subErr } = await admin
      .from("preschools")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active");
    if (subErr) throw subErr;

    // Optional AI usage count (best effort)
    let ai_usage_count = 0;
    try {
      const { count: aiCount } = await admin
        .from("ai_usage_logs" as any)
        .select("*", { count: "exact", head: true });
      ai_usage_count = aiCount ?? 0;
    } catch (_) {
      ai_usage_count = 0;
    }

    return json({
      success: true,
      total_schools: total_schools ?? 0,
      total_users: total_users ?? 0,
      total_students: total_students ?? 0,
      total_teachers: roleCounts["teacher"] || 0,
      total_parents: roleCounts["parent"] || 0,
      active_subscriptions: active_subscriptions ?? 0,
      ai_usage_count,
    });
  } catch (e) {
    console.error("platform-stats error:", e);
    return json({ success: false, error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

