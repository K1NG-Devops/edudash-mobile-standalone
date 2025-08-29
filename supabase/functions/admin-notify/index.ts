// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: admin-notify
// Purpose: Create system/admin notifications bypassing RLS using service role key.
// Route: POST /admin-notify
// Security: Requires Authorization: Bearer <SERVICE_ROLE_KEY>
// Env: SUPABASE_URL (auto), SUPABASE_SERVICE_ROLE_KEY (secret)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types for request
interface NotificationPayload {
  user_id?: string; // target user (optional if targeting all by role or preschool later)
  title: string;
  body: string;
  data?: Record<string, any>;
  // optional future targeting fields
  preschool_id?: string;
  role?: string;
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function error(status: number, message: string, extra?: Record<string, unknown>) {
  return jsonResponse({ error: message, ...extra }, { status });
}

function getBearer(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return error(405, "Method Not Allowed");
    }

    const serviceKey = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceKey || !supabaseUrl) {
      return error(500, "Server not configured (missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL)");
    }

    const bearer = getBearer(req);
    if (!bearer || bearer !== serviceKey) {
      return error(401, "Unauthorized: missing or invalid service role token");
    }

    let payload: NotificationPayload | null = null;
    try {
      payload = await req.json();
    } catch {
      return error(400, "Invalid JSON body");
    }

    if (!payload) return error(400, "Missing request body");

    // Minimal validation
    const { user_id, title, body, data, preschool_id, role } = payload;
    if (!title || !body) {
      return error(400, "title and body are required");
    }

    // Create Supabase client with service role to bypass RLS safely
    const supabase = createClient(supabaseUrl, serviceKey);

    // Insert notification. Adapt column names to your schema as needed.
    // Expecting a table notifications with columns: id, user_id, title, body, data, created_at, read_at, etc.
    const insertData: Record<string, any> = {
      user_id: user_id ?? null,
      title,
      body,
      data: data ?? null,
    };

    if (preschool_id) insertData.preschool_id = preschool_id;
    if (role) insertData.role = role;

    const { data: rows, error: dbError } = await supabase
      .from("notifications")
      .insert(insertData)
      .select()
      .limit(1)
      .single();

    if (dbError) {
      return error(500, "Failed to insert notification", { details: dbError.message });
    }

    return jsonResponse({ ok: true, notification: rows }, { status: 201 });
  } catch (e) {
    return error(500, "Unexpected error", { details: e instanceof Error ? e.message : String(e) });
  }
});

