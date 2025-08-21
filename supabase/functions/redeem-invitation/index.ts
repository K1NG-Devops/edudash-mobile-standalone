// Supabase Edge Function: redeem-invitation
// Validates and redeems a school invitation code for teacher/parent signup.
// Creates/links the auth user and user profile, assigns role and preschool_id, and marks the code as used.
// Note: For parents, we DO NOT link to a child here. Parent first joins the school; child registration happens later.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, any>;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Service not configured" }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const body = (await req.json()) as Json;
    const code = String(body?.code || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const name = String(body?.name || '').trim();
    const password = String(body?.password || '').trim();

    if (!code || !email || !name || !password) {
      return json({ error: "Missing required fields (code, email, name, password)" }, 400);
    }

    // Validate invitation via RPC if available
    let invite: any = null;
    try {
      const { data, error } = await (admin as any).rpc('validate_invitation_code', { p_code: code, p_email: email });
      if (error) throw error;
      invite = Array.isArray(data) ? data[0] : data;
    } catch (_e) {
      // Fallback: read from invitation_codes table
      const { data } = await admin
        .from('invitation_codes' as any)
        .select('*')
        .eq('code', code)
        .maybeSingle();
      invite = data;
    }

    if (!invite) return json({ error: "Invalid or expired invitation code" }, 400);

    // Basic fields expected from invitation
    const preschool_id: string | null = invite.preschool_id ?? invite.school_id ?? null;
    const role: string = invite.role ?? invite.invited_role ?? 'teacher';

    if (!preschool_id) return json({ error: "Invitation not linked to a school" }, 400);

    // Create or get auth user
    let authUserId: string | null = null;

    // Check if user exists
    try {
      const existingUser = await admin.auth.admin.listUsers({ page: 1, perPage: 1, email });
      if ((existingUser?.data?.users || []).length > 0) {
        authUserId = existingUser.data!.users![0].id;
      }
    } catch (_) {}

    if (!authUserId) {
      const { data: created, error: authErr } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role, preschool_id },
      });
      if (authErr || !created?.user) return json({ error: `Failed to create auth user: ${authErr?.message || 'unknown'}` }, 500);
      authUserId = created.user.id;
    }

    // Ensure profile exists/updated
    const { data: profile } = await admin
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId!)
      .maybeSingle();

    if (!profile) {
      const { error: insertErr } = await admin.from('users').insert({
        auth_user_id: authUserId!,
        email,
        name,
        role,
        preschool_id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any);
      if (insertErr) return json({ error: `Failed to create profile: ${insertErr.message}` }, 500);
    } else {
      const { error: updErr } = await admin
        .from('users')
        .update({ name, role, preschool_id, updated_at: new Date().toISOString() } as any)
        .eq('auth_user_id', authUserId!);
      if (updErr) return json({ error: `Failed to update profile: ${updErr.message}` }, 500);
    }

    // Do NOT link parent->child here. Parent first joins the school; child registration happens later.

    // Mark invitation as used via RPC or table update
    try {
      await (admin as any).rpc('use_invitation_code', {
        p_code: code,
        p_auth_user_id: authUserId,
        p_email: email,
      });
    } catch (_e) {
      try {
        await admin
          .from('invitation_codes' as any)
          .update({ used: true, used_by: email, used_at: new Date().toISOString() })
          .eq('code', code);
      } catch (_) {}
    }

    // Optional: audit log
    try {
      await admin.from('system_logs' as any).insert({
        type: 'invitation_redeemed',
        severity: 'low',
        description: `Invitation redeemed by ${email} as ${role}`,
        metadata: { email, role, preschool_id, code: code.slice(0, 2) + '***' },
        created_at: new Date().toISOString(),
      });
    } catch (_) {}

    return json({ success: true, role, preschool_id });
  } catch (e) {
    console.error('redeem-invitation error:', e);
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

