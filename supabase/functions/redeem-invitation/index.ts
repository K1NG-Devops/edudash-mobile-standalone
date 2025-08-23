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
    const SERVICE_ROLE_KEY = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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
      // ignore RPC errors and fall through to table-based validation
    }

    // Fallback: if RPC not available or returned no match, try tables
    if (!invite) {
      const now = new Date();
      const nowIso = now.toISOString();

      // First, load the row regardless of filters to give precise error reasons
      const { data: rawSic } = await admin
        .from('school_invitation_codes' as any)
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (rawSic) {
        // Email restriction (do not enforce for general/parent-wide codes)
        const invitedEmail = String(rawSic.invited_email || '').toLowerCase();
        const isPlaceholder = invitedEmail === 'parent@pending.local' || invitedEmail === 'any' || invitedEmail === 'any@any';
        const enforceEmailMatch = !!invitedEmail && rawSic.invitation_type !== 'parent' && !isPlaceholder;
        if (enforceEmailMatch && invitedEmail !== email) {
          return json({ error: 'This invitation code is restricted to a different email address.' }, 400);
        }
        // Expiry check
        if (rawSic.expires_at && new Date(rawSic.expires_at) <= now) {
          return json({ error: 'This invitation code has expired.' }, 400);
        }
        // Activity / usage check
        if (rawSic.is_active === false) {
          return json({ error: 'This invitation code is no longer active.' }, 400);
        }
        if (typeof rawSic.max_uses === 'number' && rawSic.max_uses > 0) {
          const nextUses = (rawSic.current_uses ?? 0) + 1;
          if (nextUses > rawSic.max_uses) {
            return json({ error: 'This invitation code has reached its usage limit.' }, 400);
          }
        }
        // If all checks pass, treat as valid
        invite = {
          ...rawSic,
          preschool_id: rawSic.preschool_id,
          invited_role: rawSic.invitation_type,
        };
      }

      // Legacy fallback: invitation_codes
      if (!invite) {
        const { data: ic } = await admin
          .from('invitation_codes' as any)
          .select('*')
          .eq('code', code)
          .maybeSingle();
        invite = ic || null;
      }
    }

    if (!invite) return json({ error: "Invalid or expired invitation code" }, 400);

    // Basic fields expected from invitation
    const preschool_id: string | null = invite.preschool_id ?? invite.school_id ?? null;
    const role: string = invite.role ?? invite.invited_role ?? invite.invitation_type ?? 'teacher';

    if (!preschool_id) return json({ error: "Invitation not linked to a school" }, 400);

    // Create or get auth user
    let authUserId: string | null = null;

    // Try to create the user first
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, preschool_id },
    });

    if (created?.user?.id) {
      authUserId = created.user.id;
    } else {
      // If the user already exists, look them up by email (paginate a few pages to find)
      const maybeAlreadyExists = (createErr?.message || '').toLowerCase();
      if (
        maybeAlreadyExists.includes('already') ||
        maybeAlreadyExists.includes('exists') ||
        maybeAlreadyExists.includes('duplicate')
      ) {
        try {
          const PER_PAGE = 200;
          const MAX_PAGES = 5;
          for (let page = 1; page <= MAX_PAGES && !authUserId; page++) {
            const { data: list } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE } as any);
            const found = (list?.users || []).find((u: any) => String(u.email || '').toLowerCase() === email);
            if (found) authUserId = found.id;
            if ((list?.users || []).length < PER_PAGE) break; // last page
          }
        } catch (_) { }
        if (!authUserId) {
          return json({ error: `Auth user exists but could not be fetched by email: ${email}` }, 500);
        }
        // Best-effort: update metadata to include role/preschool
        try {
          await admin.auth.admin.updateUserById(authUserId, {
            email_confirm: true,
            user_metadata: { name, role, preschool_id }
          });
        } catch (_) { }
      } else {
        return json({ error: `Failed to create auth user: ${createErr?.message || 'unknown'}` }, 500);
      }
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
        p_name: name,
        p_phone: null,
      });
    } catch (_e) {
      try {
        // Legacy table
        await admin
          .from('invitation_codes' as any)
          .update({ used: true, used_by: email, used_at: new Date().toISOString() } as any)
          .eq('code', code);
      } catch (_) { }

      try {
        // New table: update usage counters and deactivate when max_uses reached
        const nextUses = (invite?.current_uses ?? 0) + 1;
        const hasMax = typeof invite?.max_uses === 'number' && invite.max_uses > 0;
        const stillActive = hasMax ? nextUses < invite.max_uses : true;
        await admin
          .from('school_invitation_codes' as any)
          .update({
            used_at: new Date().toISOString(),
            used_by: authUserId,
            current_uses: nextUses,
            is_active: stillActive,
          } as any)
          .eq('code', code);
      } catch (_) { }
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
    } catch (_) { }

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

