// Supabase Edge Function: ai-proxy
// Purpose: Securely proxy Anthropic requests, enforce subscription limits, and log usage server-side

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface InvokeBody {
  feature?: "lesson_generation" | "homework_grading" | "stem_activity" | "progress_analysis" | string;
  prompt?: string;
  params?: Record<string, unknown>;
  model?: string;
  action?: string; // e.g., 'admin_reset_ai_usage'
  reset?: {
    scope: 'user' | 'preschool' | 'platform';
    target_user_id?: string;
    target_preschool_id?: string;
    mode?: 'soft' | 'hard';
    reason?: string;
  };
}

function json(body: unknown, status = 200, corsHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function monthBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function dayBounds(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function featureModelDefaults(feature: string) {
  switch (feature) {
    case "homework_grading":
    case "progress_analysis":
      return { max_tokens: 2000, temperature: 0.5 };
    case "lesson_generation":
    case "stem_activity":
    default:
      return { max_tokens: 4000, temperature: 0.7 };
  }
}

async function callAnthropic(apiKey: string, prompt: string, model: string, options: { max_tokens: number; temperature: number }) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      // API version header; adjust if your Anthropic account requires newer
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.max_tokens,
      temperature: options.temperature,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Anthropic error (${res.status}): ${errText}`);
  }
  return res.json();
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = buildCorsHeaders(origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ANTHROPIC_API_KEY = Deno.env.get("SERVER_ANTHROPIC_API_KEY") || Deno.env.get("ANTHROPIC_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON || !SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
      return json({ success: false, error: "Missing server configuration" }, 500, corsHeaders);
    }

    // Authenticated client (for user context)
    const authHeader = req.headers.get('Authorization') ?? '';
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: {
        headers: {
          Authorization: authHeader,
          apikey: SUPABASE_ANON,
        },
      },
    });
    // Admin client (privileged DB access)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    // Validate user
    const { data: userRes, error: userErr } = await client.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({ success: false, error: "Unauthorized" }, 401, corsHeaders);
    }
    const authUserId = userRes.user.id;

    // Parse body
    let body: InvokeBody;
    try {
      body = await req.json();
    } catch {
      return json({ success: false, error: "Invalid JSON body" }, 400, corsHeaders);
    }
    const feature = body.feature?.toString() || "lesson_generation";

    // Map auth user to platform user & tier
    const { data: dbUser, error: dbErr } = await admin
      .from("users")
      .select("id, subscription_tier, preschool_id, role, is_active")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (dbErr) {
      return json({ success: false, error: `User lookup failed: ${dbErr.message}` }, 500, corsHeaders);
    }

    const userId = dbUser?.id;
    const userTier = (dbUser?.subscription_tier as string) || "free";
    const isSuperAdmin = dbUser?.role === 'superadmin' && !!dbUser?.is_active;

    // Admin-only action: AI usage reset with full audit trail
    if (body.action === 'admin_reset_ai_usage') {
      if (!isSuperAdmin || !userId) {
        return json({ success: false, error: 'Forbidden' }, 403, corsHeaders);
      }
      const r = body.reset || {} as any;
      const scope = (r.scope || 'platform') as 'user' | 'preschool' | 'platform';
      const target_user_id = r.target_user_id || null;
      const target_preschool_id = r.target_preschool_id || null;
      const mode = (r.mode || 'soft') as 'soft' | 'hard';
      const reason = r.reason || null;

      // Insert reset record
      await admin.from('ai_usage_resets').insert({
        requested_by_user_id: userId,
        target_scope: scope,
        target_user_id,
        target_preschool_id,
        mode,
        reason,
        status: 'completed',
        metadata: { initiated_from: 'ai-proxy', auth_user_id: authUserId }
      } as any);

      // Audit log
      await admin.from('ai_admin_actions').insert({
        actor_user_id: userId,
        action: 'ai_usage_reset',
        target_scope: scope,
        target_user_id,
        target_preschool_id,
        details: { mode, reason }
      } as any);

      return json({ success: true, reset: { scope, target_user_id, target_preschool_id, mode } }, 200, corsHeaders);
    }

    // Load school subscription to detect trial status (skip for superadmins)
    let isTrial = false;
    let trialExpired = false;
    if (!isSuperAdmin && dbUser?.preschool_id) {
      const { data: school } = await admin
        .from('preschools')
        .select('subscription_status, subscription_start_date, subscription_end_date')
        .eq('id', dbUser.preschool_id)
        .maybeSingle();
      const status = school?.subscription_status as string | null;
      const startISO = school?.subscription_start_date as string | null;
      const endISO = school?.subscription_end_date as string | null;
      isTrial = status === 'trial';
      if (isTrial) {
        const now = new Date();
        if (endISO) {
          trialExpired = new Date(endISO) < now;
        } else if (startISO) {
          const start = new Date(startISO);
          const expiry = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
          trialExpired = expiry < now;
        }
      }
    }

    if (!isSuperAdmin && isTrial && trialExpired) {
      return json({ success: false, error: 'Your 14-day trial has expired. Please upgrade to continue using AI features.', code: 'TRIAL_EXPIRED' }, 402, corsHeaders);
    }

    // Generic rate limiting for all users
    // - Burst: max 1 request per 2 seconds
    // - Sustained: max 10 requests per minute
    if (!isSuperAdmin && userId) {
      const burstWindow = new Date(Date.now() - 2_000).toISOString();
      const { count: burstCount } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', burstWindow);
      if ((burstCount ?? 0) >= 1) {
        return json({ success: false, error: 'You are sending requests too quickly. Please wait a moment and try again.', code: 'RATE_LIMIT_BURST' }, 429, corsHeaders);
      }

      const minuteWindow = new Date(Date.now() - 60_000).toISOString();
      const { count: minuteCount } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', minuteWindow);
      if ((minuteCount ?? 0) >= 10) {
        return json({ success: false, error: 'Too many requests in a short time. Please try again in a minute.', code: 'RATE_LIMIT_MINUTE' }, 429, corsHeaders);
      }
    }

    // Enforce monthly usage limits with overage support
    const limits: Record<string, number> = {
      free: 5,
      starter: 25,
      premium: 100,
      enterprise: -1, // unlimited
    };
    const limit = limits[userTier] ?? 5;
    const { start, end } = monthBounds();

    // Soft reset baseline support: if a recent soft reset exists for the user/school/platform, use that time as the baseline
    let baseline = start;
    if (userId) {
      const queries: Promise<any>[] = [];
      queries.push(
        admin.from('ai_usage_resets')
          .select('created_at')
          .eq('mode', 'soft')
          .eq('target_scope', 'user')
          .eq('target_user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );
      if (dbUser?.preschool_id) {
        queries.push(
          admin.from('ai_usage_resets')
            .select('created_at')
            .eq('mode', 'soft')
            .eq('target_scope', 'preschool')
            .eq('target_preschool_id', dbUser.preschool_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        );
      }
      queries.push(
        admin.from('ai_usage_resets')
          .select('created_at')
          .eq('mode', 'soft')
          .eq('target_scope', 'platform')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      const results = await Promise.allSettled(queries);
      for (const r of results) {
        if (r.status === 'fulfilled') {
          const ts = (r.value?.data?.created_at as string | null) || null;
          if (ts) {
            const candidate = new Date(ts).toISOString();
            if (candidate > baseline) baseline = candidate;
          }
        }
      }
    }

    let currentMonthCount = 0;
    if (userId) {
      const { count } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', baseline)
        .lte('created_at', end);
      currentMonthCount = count ?? 0;
    }

    let overageApplied = false;
    let overageAmount = 0;

    if (!isSuperAdmin && limit !== -1 && currentMonthCount >= limit) {
      if (userId) {
        const { data: prefs } = await admin
          .from('billing_preferences')
          .select('overage_enabled, overage_price_per_unit')
          .eq('user_id', userId)
          .maybeSingle();
        const overageEnabled = !!prefs?.overage_enabled;
        const pricePerUnit = Number(prefs?.overage_price_per_unit ?? (Deno.env.get('OVERAGE_PRICE_PER_REQUEST') || 3.0));
        if (overageEnabled) {
          overageApplied = true;
          overageAmount = pricePerUnit;
        } else {
          return json({ success: false, error: 'Monthly AI usage limit reached', code: 'USAGE_LIMIT' }, 402, corsHeaders);
        }
      } else {
        return json({ success: false, error: 'Monthly AI usage limit reached', code: 'USAGE_LIMIT' }, 402, corsHeaders);
      }
    }

    // Trial-specific limits
    if (!isSuperAdmin && isTrial && userId) {
      const dailyLimit = Number(Deno.env.get('TRIAL_AI_DAILY_LIMIT') || 10);
      const totalLimit = Number(Deno.env.get('TRIAL_AI_TOTAL_LIMIT') || 50);

      // Daily usage
      const { start: dStart, end: dEnd } = dayBounds();
      const { count: dailyCount } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', dStart)
        .lte('created_at', dEnd);
      if ((dailyCount ?? 0) >= dailyLimit) {
        return json({ success: false, error: `Daily AI usage limit reached during trial (limit ${dailyLimit})`, code: 'TRIAL_DAILY_LIMIT' }, 402, corsHeaders);
      }

      // Total usage across trial period
      // If we know trial start, use it; else last 14 days
      const trialStartISO = (await admin
        .from('preschools')
        .select('subscription_start_date')
        .eq('id', dbUser!.preschool_id!)
        .maybeSingle()).data?.subscription_start_date as string | null;

      const totalStart = trialStartISO ? new Date(trialStartISO) : new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const { count: totalCount } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', totalStart.toISOString());
      if ((totalCount ?? 0) >= totalLimit) {
        return json({ success: false, error: `Trial AI usage limit reached (limit ${totalLimit})`, code: 'TRIAL_TOTAL_LIMIT' }, 402, corsHeaders);
      }

      // Simple burst rate limit: 1 request per 5 seconds per user
      const recentWindow = new Date(Date.now() - 5_000).toISOString();
      const { count: recent } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', recentWindow);
      if ((recent ?? 0) >= 1) {
        return json({ success: false, error: 'You are sending requests too quickly. Please wait a few seconds and try again.', code: 'RATE_LIMIT' }, 429, corsHeaders);
      }
    }

    // Build or accept prompt
    const model = body.model || "claude-3-5-sonnet-20241022";
    let prompt = body.prompt?.toString();

    if (!prompt) {
      // Minimal prompt builder fallbacks for core features
      const p = body.params || {};
      if (feature === "lesson_generation") {
        const topic = String(p["topic"] ?? "General Learning");
        const ageGroup = String(p["ageGroup"] ?? "Preschool (3-6)");
        const duration = Number(p["duration"] ?? 30);
        const learningObjectives = Array.isArray(p["learningObjectives"]) ? (p["learningObjectives"] as string[]) : ["Creativity", "Motor skills"];
        prompt = `Create an engaging preschool lesson plan for ${ageGroup} on the topic "${topic}".
Duration: ${duration} minutes
Learning Objectives: ${learningObjectives.join(", ")}
Return JSON as in the documented format (title, description, content, activities[], assessmentQuestions[], homeExtension[]).`;
      } else if (feature === "homework_grading") {
        const t = String(p["assignmentTitle"] ?? "Homework");
        const instr = String(p["assignmentInstructions"] ?? "");
        const sub = String(p["studentSubmission"] ?? "");
        const age = Number(p["studentAge"] ?? 5);
        prompt = `Grade this ${age}-year-old preschool homework.
ASSIGNMENT: "${t}"
INSTRUCTIONS: ${instr}
STUDENT SUBMISSION: "${sub}"
Return JSON { grade, feedback, strengths[], areasForImprovement[], nextSteps[], parentNotes }. Focus on encouragement.`;
      } else if (feature === "stem_activity") {
        const topic = String(p["topic"] ?? "STEM Basics");
        const ageGroup = String(p["ageGroup"] ?? "Preschool (3-6)");
        const materials = Array.isArray(p["materials"]) ? (p["materials"] as string[]).join(", ") : "paper, crayons";
        const goals = Array.isArray(p["learningGoals"]) ? (p["learningGoals"] as string[]).join(", ") : "creativity";
        prompt = `Create a STEM activity for ${ageGroup} on "${topic}".
MATERIALS: ${materials}
GOALS: ${goals}
Return JSON { title, description, instructions[], scientificConcepts[], extensions[], safetyNotes[] }.`;
      } else if (feature === "progress_analysis") {
        prompt = `Analyze preschool learning progress and return JSON { overallProgress, keyStrengths[], developmentAreas[], recommendations[], parentSuggestions[] }`;
      } else {
        return json({ success: false, error: "Unsupported feature and no prompt provided" }, 400, corsHeaders);
      }
    }

    const options = featureModelDefaults(feature);
    const aiRes = await callAnthropic(ANTHROPIC_API_KEY, prompt, model, options);

    // Extract content and token usage
    const contentItem = aiRes?.content?.[0];
    const contentText = contentItem?.type === "text" ? String(contentItem.text || "") : "";
    const inputTokens = Number(aiRes?.usage?.input_tokens ?? 0);
    const outputTokens = Number(aiRes?.usage?.output_tokens ?? 0);
    const tokensUsed = inputTokens + outputTokens;

    // Log usage server-side (best-effort)
    if (userId) {
      await admin.from("ai_usage_logs").insert({
        user_id: userId,
        feature,
        tokens_used: tokensUsed,
        created_at: new Date().toISOString(),
      } as any);

      if (overageApplied) {
        await admin.from('ai_overage_logs').insert({
          user_id: userId,
          feature,
          units: 1,
          amount: overageAmount,
          created_at: new Date().toISOString(),
        } as any);
      }
    }

    return json({ success: true, content: contentText, usage: { inputTokens, outputTokens }, overage: overageApplied ? { charged: true, amount: overageAmount } : { charged: false } }, 200, corsHeaders);
  } catch (e) {
    console.error("ai-proxy error:", e);
    return json({ success: false, error: (e as Error).message || String(e) }, 500, corsHeaders);
  }
});

