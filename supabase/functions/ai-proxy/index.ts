// Supabase Edge Function: ai-proxy
// Purpose: Securely proxy Anthropic requests, enforce subscription limits, and log usage server-side

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface InvokeBody {
  feature: "lesson_generation" | "homework_grading" | "stem_activity" | "progress_analysis" | string;
  prompt?: string;
  params?: Record<string, unknown>;
  model?: string;
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
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: req.headers } });
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
      .select("id, subscription_tier, preschool_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (dbErr) {
      return json({ success: false, error: `User lookup failed: ${dbErr.message}` }, 500, corsHeaders);
    }

    const userId = dbUser?.id;
    const userTier = (dbUser?.subscription_tier as string) || "free";

    // Enforce monthly usage limits
    const limits: Record<string, number> = {
      free: 5,
      starter: 20,
      premium: 100,
      enterprise: -1, // unlimited
    };
    const limit = limits[userTier] ?? 5;
    const { start, end } = monthBounds();

    let currentMonthCount = 0;
    if (userId) {
      const { count } = await admin
        .from("ai_usage_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", start)
        .lte("created_at", end);
      currentMonthCount = count ?? 0;
    }

    if (limit !== -1 && currentMonthCount >= limit) {
      return json({ success: false, error: "Monthly AI usage limit reached", code: "USAGE_LIMIT" }, 402, corsHeaders);
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
    }

    return json({ success: true, content: contentText, usage: { inputTokens, outputTokens } }, 200, corsHeaders);
  } catch (e) {
    console.error("ai-proxy error:", e);
    return json({ success: false, error: (e as Error).message || String(e) }, 500, corsHeaders);
  }
});

