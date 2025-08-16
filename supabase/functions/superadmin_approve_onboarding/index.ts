// Supabase Edge Function: superadmin_approve_onboarding
// Approves an onboarding request and provisions the school + principal user

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, any>;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Missing auth token" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Service configuration missing" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    // Validate caller user and enforce superadmin role
    const { data: tokenUser, error: tokenErr } = await admin.auth.getUser(token);
    if (tokenErr || !tokenUser?.user) return json({ error: "Invalid token" }, 401);

    const authUserId = tokenUser.user.id;
    const { data: caller } = await admin
      .from("users")
      .select("id, role, is_active")
      .eq("auth_user_id", authUserId)
      .single();

    if (!caller || caller.role !== "superadmin" || !caller.is_active) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as Json;
    const requestId: string | undefined = body?.requestId;
    if (!requestId) return json({ error: "requestId is required" }, 400);

    // Fetch onboarding request
    const { data: request, error: reqErr } = await admin
      .from("preschool_onboarding_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (reqErr || !request) return json({ error: "Request not found" }, 404);

    // Idempotency: if already approved and school exists, return success
    const { data: existingSchool } = await admin
      .from("preschools")
      .select("id, name, email, onboarding_status, setup_completed")
      .eq("email", request.admin_email)
      .maybeSingle();

    if (existingSchool && existingSchool.setup_completed && existingSchool.onboarding_status === "completed") {
      // Ensure request is marked approved
      await admin
        .from("preschool_onboarding_requests")
        .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: caller.id })
        .eq("id", requestId);
      return json({ success: true, school_id: existingSchool.id, admin_email: request.admin_email, already_provisioned: true });
    }

    // Approve request first (record keeping)
    await admin
      .from("preschool_onboarding_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: caller.id })
      .eq("id", requestId);

    // Create school
    const tenantSlug = String(request.preschool_name || "school")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);

    const { data: school, error: schoolErr } = await admin
      .from("preschools")
      .insert({
        name: request.preschool_name,
        email: request.admin_email,
        phone: request.phone ?? null,
        address: request.address ?? null,
        tenant_slug: tenantSlug,
        subscription_plan: "trial",
        subscription_status: "active",
        max_students: request.number_of_students ?? 50,
        billing_email: request.admin_email,
        onboarding_status: "completed",
        setup_completed: true,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (schoolErr || !school) {
      // Revert request to pending on failure
      await admin
        .from("preschool_onboarding_requests")
        .update({ status: "pending", reviewed_at: null, reviewed_by: null })
        .eq("id", requestId);
      return json({ error: `Failed to create school: ${schoolErr?.message || "unknown"}` }, 500);
    }

    // Create strong temporary password
    const tempPassword = generateSecurePassword();

    // Create Auth user for principal
    const { data: createdAuth, error: authErr } = await admin.auth.admin.createUser({
      email: request.admin_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: request.admin_name,
        role: "principal",
        preschool_id: school.id,
      },
    });

    if (authErr || !createdAuth?.user) {
      // Rollback school on auth failure
      await admin.from("preschools").delete().eq("id", school.id);
      await admin
        .from("preschool_onboarding_requests")
        .update({ status: "pending", reviewed_at: null, reviewed_by: null })
        .eq("id", requestId);
      return json({ error: `Failed to create admin user: ${authErr?.message || "unknown"}` }, 500);
    }

    const authId = createdAuth.user.id;

    // Ensure public.users profile exists; if not, create manually
    const { data: profile } = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", authId)
      .single();

    if (!profile) {
      await admin.from("users").insert({
        auth_user_id: authId,
        email: request.admin_email,
        name: request.admin_name,
        role: "principal",
        preschool_id: school.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      await admin
        .from("users")
        .update({ preschool_id: school.id, role: "principal", name: request.admin_name, updated_at: new Date().toISOString() })
        .eq("auth_user_id", authId);
    }

    // Return credentials; email sending is handled in app/service or can be added here later
    return json({ success: true, school_id: school.id, admin_email: request.admin_email, temp_password: tempPassword });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function generateSecurePassword(): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = [pick(lowercase), pick(uppercase), pick(digits), pick(symbols)];
  const all = lowercase + uppercase + digits + symbols;
  for (let i = 4; i < 12; i++) base.push(pick(all));
  return base.sort(() => Math.random() - 0.5).join("");
}


