// Supabase Edge Function: get-users-admin
// Returns all users with school names using service role to bypass RLS

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
    const SERVICE_ROLE_KEY = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Missing service configuration" }, 500);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Get all users
    const { data: users, error: usersError } = await admin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (usersError) throw usersError;

    if (!users) {
      return json({ success: true, users: [] });
    }

    // Get all schools to create a mapping
    const { data: schools } = await admin
      .from("preschools")
      .select("id, name");

    const schoolsMap = (schools ?? []).reduce((acc: any, school: any) => {
      acc[school.id] = school.name;
      return acc;
    }, {});

    // Enhance users with school names
    const enhancedUsers = users.map((user) => ({
      ...user,
      school_name: user.preschool_id ? schoolsMap[user.preschool_id] || 'Unknown School' : null,
      last_login: null, // Would come from auth logs if available
      is_suspended: !user.is_active,
      subscription_status: null, // Would come from billing system
      total_students: 0, // Would need to count students for this user
      account_status: user.is_active ? 'active' : 'inactive'
    }));

    return json({
      success: true,
      users: enhancedUsers,
    });
  } catch (e) {
    console.error("get-users-admin error:", e);
    return json({ success: false, error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
