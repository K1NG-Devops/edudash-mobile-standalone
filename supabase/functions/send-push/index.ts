// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: send-push
// Purpose: Send Expo push notifications to provided Expo push tokens.
// Security: Requires Authorization: Bearer <SERVER_NOTIFY_FUNCTION_TOKEN>
// Note: This function does NOT read from DB; caller must provide tokens.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface PushRequest {
  tokens: string[]; // Expo push tokens (ExponentPushToken[...] format)
  title?: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  channelId?: string; // Android notification channel id
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

    const functionToken = Deno.env.get("SERVER_NOTIFY_FUNCTION_TOKEN");
    const bearer = getBearer(req);
    if (!functionToken || !bearer || bearer !== functionToken) {
      return error(401, "Unauthorized: missing or invalid function token");
    }

    let payload: PushRequest | null = null;
    try {
      payload = await req.json();
    } catch {
      return error(400, "Invalid JSON body");
    }

    if (!payload) return error(400, "Missing request body");

    const { tokens, title, body, data, sound = "default", channelId = "default" } = payload;
    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return error(400, "tokens array is required");
    }
    if (!body || typeof body !== 'string') {
      return error(400, "body is required");
    }

    const messages = tokens.map((to) => ({
      to,
      title: title || undefined,
      body,
      data: data || undefined,
      sound,
      channelId,
    }));

    const expoResp = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const result = await expoResp.json();
    if (!expoResp.ok) {
      return error(expoResp.status, "Expo push API error", { details: result });
    }

    return jsonResponse({ ok: true, result });
  } catch (e) {
    return error(500, "Unexpected error", { details: e instanceof Error ? e.message : String(e) });
  }
});
