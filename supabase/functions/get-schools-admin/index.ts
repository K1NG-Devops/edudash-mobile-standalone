// Supabase Edge Function: get-schools-admin
// Returns all schools with detailed info using service role to bypass RLS

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

    // Get all schools with enhanced info
    const { data: schools, error: schoolsError } = await admin
      .from("preschools")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (schoolsError) throw schoolsError;

    if (!schools) {
      return json({ success: true, schools: [] });
    }

    // Enhance each school with user and student counts
    const enhancedSchools = await Promise.all(
      schools.map(async (school) => {
        try {
          // Get user counts by role
          const { data: users } = await admin
            .from("users")
            .select("role, is_active")
            .eq("preschool_id", school.id);

          // Get student count
          const { count: studentCount } = await admin
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("preschool_id", school.id)
            .eq("is_active", true);

          const userCounts = (users ?? []).reduce(
            (acc: any, user: any) => {
              if (user.is_active) {
                acc.active_users += 1;
                if (user.role === "teacher") acc.teachers += 1;
                if (user.role === "parent") acc.parents += 1;
                if (user.role === "principal") acc.principals += 1;
              }
              acc.total_users += 1;
              return acc;
            },
            { active_users: 0, total_users: 0, teachers: 0, parents: 0, principals: 0 }
          );

          return {
            ...school,
            user_count: userCounts.total_users,
            student_count: studentCount ?? 0,
            teacher_count: userCounts.teachers,
            parent_count: userCounts.parents,
            last_activity: school.updated_at || school.created_at || new Date().toISOString(),
            subscription_status: school.subscription_status || 'active',
            monthly_fee: 0,
            ai_usage: 0,
            storage_usage: 0
          };
        } catch (error) {
          console.error(`Error enhancing school ${school.id}:`, error);
          return {
            ...school,
            user_count: 0,
            student_count: 0,
            teacher_count: 0,
            parent_count: 0,
            last_activity: school.updated_at || school.created_at || new Date().toISOString(),
            subscription_status: school.subscription_status || 'active',
            monthly_fee: 0,
            ai_usage: 0,
            storage_usage: 0
          };
        }
      })
    );

    return json({
      success: true,
      schools: enhancedSchools,
    });
  } catch (e) {
    console.error("get-schools-admin error:", e);
    return json({ success: false, error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
