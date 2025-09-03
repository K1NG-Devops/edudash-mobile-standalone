// Supabase Edge Function: ai-proxy
// Purpose: Securely proxy Anthropic requests, enforce subscription limits, and log usage server-side

import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";

interface InvokeBody {
  feature?: "lesson_generation" | "homework_grading" | "stem_activity" | "progress_analysis" | "homework_help" | string;
  prompt?: string;
  params?: Record<string, unknown>;
  model?: string;
  // Optional lightweight attachment support: server will fetch and embed into content
  attachments?: Array<{
    url: string;
    mime_type?: string;
    name?: string;
  }>;
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

function sevenDaysAgoISO(now = new Date()) {
  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function featureModelDefaults(feature: string) {
  switch (feature) {
    case "homework_grading":
    case "progress_analysis":
      return { max_tokens: 2000, temperature: 0.5 };
    case "homework_help":
      return { max_tokens: 3000, temperature: 0.6 };
    case "lesson_generation":
    case "stem_activity":
    default:
      return { max_tokens: 4000, temperature: 0.7 };
  }
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Attempt to extract plaintext from DOCX using JSZip
async function extractDocxText(ab: ArrayBuffer): Promise<string> {
  try {
    const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
    const zip = await JSZip.loadAsync(new Uint8Array(ab));
    const doc = zip.file('word/document.xml');
    if (!doc) return '';
    const xml = await doc.async('string');
    // Replace key tags with whitespace markers then strip remaining tags
    let text = xml
      .replace(/<w:tab\b[^>]*\/>/g, '\t')
      .replace(/<w:br\b[^>]*\/>/g, '\n')
      .replace(/<w:p\b[^>]*>/g, '\n')
      .replace(/<wp:docPr[^>]*\/>/g, '')
      .replace(/<[^>]+>/g, '');
    text = decodeXmlEntities(text);
    return text.trim();
  } catch (e) {
    console.error('DOCX extraction failed:', e);
    return '';
  }
}

// Attempt to extract plaintext from PPTX using JSZip (slides)
async function extractPptxText(ab: ArrayBuffer): Promise<string> {
  try {
    const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
    const zip = await JSZip.loadAsync(new Uint8Array(ab));
    const files = Object.keys(zip.files).filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p));
    files.sort();
    let out = '';
    for (const p of files) {
      const xml = await zip.file(p)!.async('string');
      let text = xml.replace(/<a:t[^>]*>/g, '').replace(/<[^>]+>/g, '');
      text = decodeXmlEntities(text).trim();
      if (text) out += text + '\n\n';
      if (out.length > 60000) break;
    }
    return out.trim();
  } catch (e) {
    console.error('PPTX extraction failed:', e);
    return '';
  }
}

// Attempt to extract plaintext from XLSX using JSZip (shared strings)
async function extractXlsxText(ab: ArrayBuffer): Promise<string> {
  try {
    const { default: JSZip } = await import('https://esm.sh/jszip@3.10.1');
    const zip = await JSZip.loadAsync(new Uint8Array(ab));
    const shared = zip.file('xl/sharedStrings.xml');
    let out = '';
    if (shared) {
      const xml = await shared.async('string');
      const cleaned = decodeXmlEntities(xml.replace(/<[^>]+>/g, ' '));
      out += cleaned;
    } else {
      // Fallback: scan worksheets for raw values
      const sheets = Object.keys(zip.files).filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p));
      sheets.sort();
      for (const p of sheets) {
        const xml = await zip.file(p)!.async('string');
        const cleaned = decodeXmlEntities(xml.replace(/<[^>]+>/g, ' '));
        out += cleaned + '\n\n';
        if (out.length > 60000) break;
      }
    }
    return out.trim();
  } catch (e) {
    console.error('XLSX extraction failed:', e);
    return '';
  }
}

// Attempt to extract plaintext from PDF using pdfjs-dist (best effort)
async function extractPdfText(ab: ArrayBuffer): Promise<string> {
  try {
    const pdfjsLib: any = await import('https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.js');
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(ab) });
    const pdf = await loadingTask.promise;
    let out = '';
    const maxPages = Math.min(pdf.numPages || 0, 15);
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      const pageText = (tc.items || []).map((it: any) => String(it.str || '')).join(' ');
      out += pageText + '\n\n';
      if (out.length > 25000) break;
    }
    return out.trim();
  } catch (e) {
    console.error('PDF extraction failed:', e);
    return '';
  }
}

async function callAnthropic(
  apiKey: string,
  contentOrPrompt: string | any[],
  model: string,
  options: { max_tokens: number; temperature: number }
) {
  const content = Array.isArray(contentOrPrompt)
    ? contentOrPrompt
    : [{ type: "text", text: String(contentOrPrompt || "") }];

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
      messages: [{ role: "user", content }],
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
      return json({ success: false, error: "Missing server configuration", code: 'CONFIG_MISSING', error_type: 'ai_config', quota_charged: false }, 500, corsHeaders);
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
      return json({ success: false, error: "Unauthorized", code: 'UNAUTHORIZED', error_type: 'auth', quota_charged: false }, 401, corsHeaders);
    }
    const authUserId = userRes.user.id;

    // Parse body
    let body: InvokeBody;
    try {
      body = await req.json();
} catch {
      return json({ success: false, error: "Invalid JSON body", code: 'INVALID_JSON', error_type: 'validation', quota_charged: false }, 400, corsHeaders);
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

    // Whitelist models per tier
    const tierAllowed: Record<string, string[]> = {
      free: ["claude-3-haiku-20240307"],
      starter: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20241022"],
      premium: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20241022"],
      enterprise: ["claude-3-haiku-20240307", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
    };

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

    // Admin-only action: enable/disable overage for testers (per user or per preschool)
    if (body.action === 'admin_set_overage') {
      if (!isSuperAdmin || !userId) {
        return json({ success: false, error: 'Forbidden' }, 403, corsHeaders);
      }
      const o = (body as any).overage || {};
      const scope = (o.scope || 'user') as 'user' | 'preschool';
      const target_user_id = o.target_user_id || null;
      const target_preschool_id = o.target_preschool_id || null;
      const enabled = Boolean(o.enabled);
      const price = Number(o.price_per_unit ?? o.price ?? 0);

      async function upsertPref(uid: string) {
        await admin.from('billing_preferences').upsert({
          user_id: uid,
          overage_enabled: enabled,
          overage_price_per_unit: isNaN(price) ? 0 : price,
        } as any, { onConflict: 'user_id' } as any);
      }

      if (scope === 'user' && target_user_id) {
        await upsertPref(target_user_id);
      } else if (scope === 'preschool' && target_preschool_id) {
        const { data: users } = await admin.from('users').select('id').eq('preschool_id', target_preschool_id);
        for (const u of (users || [])) {
          await upsertPref(u.id);
        }
      } else {
        return json({ success: false, error: 'Missing target for overage toggle' }, 400, corsHeaders);
      }

      await admin.from('ai_admin_actions').insert({
        actor_user_id: userId,
        action: 'admin_set_overage',
        target_scope: scope,
        target_user_id,
        target_preschool_id,
        details: { enabled, price }
      } as any);

      return json({ success: true, overage: { scope, target_user_id, target_preschool_id, enabled, price_per_unit: price } }, 200, corsHeaders);
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
      return json({ success: false, error: 'Your 14-day trial has expired. Please upgrade to continue using AI features.', code: 'TRIAL_EXPIRED', error_type: 'quota', quota_charged: false }, 402, corsHeaders);
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
        return json({ success: false, error: 'You are sending requests too quickly. Please wait a moment and try again.', code: 'RATE_LIMIT_BURST', error_type: 'rate_limit', quota_charged: false }, 429, corsHeaders);
      }

      const minuteWindow = new Date(Date.now() - 60_000).toISOString();
      const { count: minuteCount } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', minuteWindow);
if ((minuteCount ?? 0) >= 10) {
        return json({ success: false, error: 'Too many requests in a short time. Please try again in a minute.', code: 'RATE_LIMIT_MINUTE', error_type: 'rate_limit', quota_charged: false }, 429, corsHeaders);
      }
    }

    // Enforce weekly and monthly usage limits with overage support
    // Note: counts are per request (not tokens). Streaming still counts as one request.
    const monthlyLimits: Record<string, number> = {
      free: 20,
      starter: 120,
      premium: 600,
      enterprise: -1, // unlimited
    };
    const weeklyLessonLimits: Record<string, number> = {
      free: 10,
      starter: 50,
      premium: 200,
      enterprise: -1,
    };
    const monthlyLimit = monthlyLimits[userTier] ?? 20;
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

    // Weekly limit specifically for lesson_generation feature (rolling 7 days)
    let weeklyLessonCount = 0;
    if (userId && (body.feature?.toString() || 'lesson_generation') === 'lesson_generation') {
      const since = sevenDaysAgoISO();
      const { count: wcount } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', 'lesson_generation')
        .gte('created_at', since);
      weeklyLessonCount = wcount ?? 0;
    }

    let overageApplied = false;
    let overageAmount = 0;

    // Enforce weekly lesson limit first (if applicable and not unlimited)
    if (!isSuperAdmin && (weeklyLessonLimits[userTier] ?? -1) !== -1 && weeklyLessonCount >= (weeklyLessonLimits[userTier] ?? 0)) {
      return json({ success: false, error: `Weekly AI lesson generation limit reached (limit ${weeklyLessonLimits[userTier]})`, code: 'WEEKLY_LIMIT', error_type: 'quota', quota_charged: false }, 402, corsHeaders);
    }

    // Then enforce monthly overall request limit
    if (!isSuperAdmin && monthlyLimit !== -1 && currentMonthCount >= monthlyLimit) {
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
          return json({ success: false, error: 'Monthly AI usage limit reached', code: 'USAGE_LIMIT', error_type: 'quota', quota_charged: false }, 402, corsHeaders);
        }
      } else {
        return json({ success: false, error: 'Monthly AI usage limit reached', code: 'USAGE_LIMIT', error_type: 'quota', quota_charged: false }, 402, corsHeaders);
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
        return json({ success: false, error: `Daily AI usage limit reached during trial (limit ${dailyLimit})`, code: 'TRIAL_DAILY_LIMIT', error_type: 'quota', quota_charged: false }, 402, corsHeaders);
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
        return json({ success: false, error: `Trial AI usage limit reached (limit ${totalLimit})`, code: 'TRIAL_TOTAL_LIMIT', error_type: 'quota', quota_charged: false }, 402, corsHeaders);
      }

      // Simple burst rate limit: 1 request per 5 seconds per user
      const recentWindow = new Date(Date.now() - 5_000).toISOString();
      const { count: recent } = await admin
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', recentWindow);
if ((recent ?? 0) >= 1) {
        return json({ success: false, error: 'You are sending requests too quickly. Please wait a few seconds and try again.', code: 'RATE_LIMIT', error_type: 'rate_limit', quota_charged: false }, 429, corsHeaders);
      }
    }

    // Build or accept prompt - use tier-appropriate model
    const tierModels: Record<string, string> = {
      free: "claude-3-haiku-20240307",           // Fast, cost-effective
      starter: "claude-3-5-sonnet-20241022",     // Better quality
      premium: "claude-3-5-sonnet-20241022",     // Same as starter for now
      enterprise: "claude-3-5-sonnet-20241022"   // Could upgrade to Opus for enterprise
    };

    const wantStream = Boolean((body as any).stream === true || (body.params as any)?.stream === true);
    
    let model = body.model || tierModels[userTier] || "claude-3-haiku-20240307";
    if (!isSuperAdmin) {
      const allowedModels = tierAllowed[userTier] || tierAllowed['free'];
      if (!allowedModels.includes(model)) {
        model = allowedModels[0];
      }
    }
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

Based on current educational best practices and age-appropriate developmental standards for ${ageGroup}, create content that:
- Uses evidence-based teaching methods for early childhood education
- Incorporates sensory learning and hands-on activities
- Aligns with current preschool curriculum standards
- Includes safety considerations appropriate for the age group
- Follows developmentally appropriate practices (DAP)

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
      } else if (feature === "homework_help") {
        const q = String(p["question"] ?? "Help with homework");
        const childAge = String(p["childAge"] ?? "5");
        const childName = String(p["childName"] ?? "the child");
        prompt = `You are a warm, practical AI tutor helping a parent support ${childName}, age ${childAge}, with homework. 
Question: "${q}"
If attachments are provided, use them as context. Provide a step-by-step plan and helpful tips. 
Return JSON { "answer": string, "suggestions": string[] }`;
      } else {
        return json({ success: false, error: "Unsupported feature and no prompt provided", code: 'UNSUPPORTED_FEATURE', error_type: 'validation', quota_charged: false }, 400, corsHeaders);
      }
    }

    // Build optional content parts with attachments
    let contentParts: any[] | undefined;
    const maxTextCharsPerFile = Number(Deno.env.get('AI_ATTACHMENT_MAX_CHARS_PER_FILE') || 24000);
    const maxTextCharsTotal = Number(Deno.env.get('AI_ATTACHMENT_MAX_CHARS_TOTAL') || 60000);
    const maxFiles = Number(Deno.env.get('AI_ATTACHMENT_MAX_FILES') || 4);
    let totalTextUsed = 0;
    const attachmentIndex: Array<{ name: string; mime: string; type: string; extracted_chars: number; truncated: boolean; included: boolean }> = [];
    if (Array.isArray(body.attachments) && body.attachments.length > 0) {
      const files = body.attachments.slice(0, maxFiles);
      const parts: any[] = [];
      // Always begin with the main prompt text
      parts.push({ type: "text", text: String(prompt || "") });
      for (const f of files) {
        try {
          const url = String((f as any).url || "");
          if (!url) continue;
          const res = await fetch(url);
          if (!res.ok) {
            parts.push({ type: "text", text: `[Attachment not available: ${f.name || url}]` });
            continue;
          }
          const ct = (f as any).mime_type || res.headers.get('content-type') || 'application/octet-stream';
          if (ct.startsWith('image/')) {
            // Encode image as base64
            const ab = await res.arrayBuffer();
            const bytes = new Uint8Array(ab);
            let binary = '';
            // chunked conversion to avoid call stack limits
            const chunkSize = 0x8000;
            for (let i = 0; i < bytes.length; i += chunkSize) {
              binary += String.fromCharCode.apply(null, Array.from(bytes.slice(i, i + chunkSize)) as any);
            }
            const b64 = btoa(binary);
            parts.push({ type: 'image', source: { type: 'base64', media_type: ct, data: b64 } });
            attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'image', extracted_chars: 0, truncated: false, included: true });
          } else if (ct.startsWith('text/') || ct.includes('json') || ct.includes('csv') || ct.includes('markdown')) {
            const text = await res.text();
            let extracted = text.slice(0, maxTextCharsPerFile);
            let truncatedByFile = text.length > maxTextCharsPerFile;
            const remaining = Math.max(0, maxTextCharsTotal - totalTextUsed);
            if (remaining <= 0) {
              parts.push({ type: 'text', text: `[Attachment skipped due to content cap: ${ (f as any).name || url }]` });
              attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'text', extracted_chars: 0, truncated: true, included: false });
            } else {
              if (extracted.length > remaining) { extracted = extracted.slice(0, remaining); truncatedByFile = true; }
              parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url } (${ct})]\n${extracted}${truncatedByFile ? '\n...[truncated]' : ''}` });
              totalTextUsed += extracted.length;
              attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'text', extracted_chars: extracted.length, truncated: truncatedByFile || false, included: true });
            }
          } else if (ct === 'application/pdf') {
            const ab = await res.arrayBuffer();
            const pdfText = await extractPdfText(ab);
            if (pdfText && pdfText.trim().length > 0) {
              let extracted = pdfText.slice(0, maxTextCharsPerFile);
              let truncatedByFile = pdfText.length > maxTextCharsPerFile;
              const remaining = Math.max(0, maxTextCharsTotal - totalTextUsed);
              if (remaining <= 0) {
                parts.push({ type: 'text', text: `[Attachment skipped due to content cap: ${ (f as any).name || url }]` });
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'pdf', extracted_chars: 0, truncated: true, included: false });
              } else {
                if (extracted.length > remaining) { extracted = extracted.slice(0, remaining); truncatedByFile = true; }
                parts.push({ type: 'text', text: `[Attachment Extracted: ${ (f as any).name || url } (PDF)]\n${extracted}${truncatedByFile ? '\n...[truncated]' : ''}` });
                totalTextUsed += extracted.length;
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'pdf', extracted_chars: extracted.length, truncated: truncatedByFile, included: true });
              }
            } else {
              parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url } (PDF)] Content could not be extracted; answer using other provided context.` });
              attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'pdf', extracted_chars: 0, truncated: false, included: true });
            }
          } else if (ct.includes('officedocument') && ct.includes('word')) {
            const ab = await res.arrayBuffer();
            const docxText = await extractDocxText(ab);
            if (docxText && docxText.trim().length > 0) {
              let extracted = docxText.slice(0, maxTextCharsPerFile);
              let truncatedByFile = docxText.length > maxTextCharsPerFile;
              const remaining = Math.max(0, maxTextCharsTotal - totalTextUsed);
              if (remaining <= 0) {
                parts.push({ type: 'text', text: `[Attachment skipped due to content cap: ${ (f as any).name || url }]` });
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'docx', extracted_chars: 0, truncated: true, included: false });
              } else {
                if (extracted.length > remaining) { extracted = extracted.slice(0, remaining); truncatedByFile = true; }
                parts.push({ type: 'text', text: `[Attachment Extracted: ${ (f as any).name || url } (DOCX)]\n${extracted}${truncatedByFile ? '\n...[truncated]' : ''}` });
                totalTextUsed += extracted.length;
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'docx', extracted_chars: extracted.length, truncated: truncatedByFile, included: true });
              }
            } else {
              parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url } (DOCX)] Content could not be extracted; answer using other provided context.` });
              attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'docx', extracted_chars: 0, truncated: false, included: true });
            }
          } else if (ct.includes('vnd.openxmlformats-officedocument.presentationml.presentation') || ct.includes('officedocument.presentationml.presentation')) {
            const ab = await res.arrayBuffer();
            const pptText = await extractPptxText(ab);
            if (pptText && pptText.trim().length > 0) {
              let extracted = pptText.slice(0, maxTextCharsPerFile);
              let truncatedByFile = pptText.length > maxTextCharsPerFile;
              const remaining = Math.max(0, maxTextCharsTotal - totalTextUsed);
              if (remaining <= 0) {
                parts.push({ type: 'text', text: `[Attachment skipped due to content cap: ${ (f as any).name || url }]` });
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'pptx', extracted_chars: 0, truncated: true, included: false });
              } else {
                if (extracted.length > remaining) { extracted = extracted.slice(0, remaining); truncatedByFile = true; }
                parts.push({ type: 'text', text: `[Attachment Extracted: ${ (f as any).name || url } (PPTX)]\n${extracted}${truncatedByFile ? '\n...[truncated]' : ''}` });
                totalTextUsed += extracted.length;
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'pptx', extracted_chars: extracted.length, truncated: truncatedByFile, included: true });
              }
            } else {
              parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url } (PPTX)] Content could not be extracted; answer using other provided context.` });
              attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'pptx', extracted_chars: 0, truncated: false, included: true });
            }
          } else if (ct.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet') || ct.includes('officedocument.spreadsheetml.sheet')) {
            const ab = await res.arrayBuffer();
            const xText = await extractXlsxText(ab);
            if (xText && xText.trim().length > 0) {
              let extracted = xText.slice(0, maxTextCharsPerFile);
              let truncatedByFile = xText.length > maxTextCharsPerFile;
              const remaining = Math.max(0, maxTextCharsTotal - totalTextUsed);
              if (remaining <= 0) {
                parts.push({ type: 'text', text: `[Attachment skipped due to content cap: ${ (f as any).name || url }]` });
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'xlsx', extracted_chars: 0, truncated: true, included: false });
              } else {
                if (extracted.length > remaining) { extracted = extracted.slice(0, remaining); truncatedByFile = true; }
                parts.push({ type: 'text', text: `[Attachment Extracted: ${ (f as any).name || url } (XLSX)]\n${extracted}${truncatedByFile ? '\n...[truncated]' : ''}` });
                totalTextUsed += extracted.length;
                attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'xlsx', extracted_chars: extracted.length, truncated: truncatedByFile, included: true });
              }
            } else {
              parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url } (XLSX)] Content could not be extracted; answer using other provided context.` });
              attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'xlsx', extracted_chars: 0, truncated: false, included: true });
            }
          } else if (ct.includes('msword')) {
            parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url } (DOC)] Legacy Word files are not supported for extraction; answer using other provided context.` });
            attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'doc', extracted_chars: 0, truncated: false, included: true });
          } else {
            parts.push({ type: 'text', text: `[Attachment: ${ (f as any).name || url }] Unsupported file type (${ct}).` });
            attachmentIndex.push({ name: (f as any).name || url, mime: ct, type: 'other', extracted_chars: 0, truncated: false, included: true });
          }
        } catch (ferr) {
          parts.push({ type: 'text', text: `[Attachment error] ${String(ferr)}` });
        }
      }
      contentParts = parts;
    }

    const options = featureModelDefaults(feature);

    // SSE streaming branch: true token streaming via Anthropic -> normalized SSE (delta/done)
    if (wantStream) {
      const stream = new ReadableStream({
        start: async (controller) => {
          const enc = new TextEncoder();
          const send = (event: string, data: any) => {
            const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(enc.encode(payload));
          };

          // Accumulators for compatibility/finalization
          let assembledText = "";
          let inputTokens = 0;
          let outputTokens = 0;

          try {
            // Prepare Anthropic request body with streaming
            const content = Array.isArray(contentParts)
              ? contentParts
              : [{ type: 'text', text: String(prompt || '') }];

            const upstream = await fetch("https://api.anthropic.com/v1/messages", {
              method: "POST",
              headers: {
                "content-type": "application/json",
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
              },
              body: JSON.stringify({
                model,
                max_tokens: options.max_tokens,
                temperature: options.temperature,
                messages: [{ role: "user", content }],
                stream: true,
              }),
            });

            if (!upstream.ok || !upstream.body) {
              const errText = await upstream.text().catch(() => "");
              throw new Error(`Anthropic stream error (${upstream.status}): ${errText}`);
            }

            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            const flushBlocks = () => {
              let idx;
              while ((idx = buffer.indexOf("\n\n")) !== -1) {
                const block = buffer.slice(0, idx);
                buffer = buffer.slice(idx + 2);
                let eventType = "";
                let dataRaw = "";
                for (const line of block.split("\n")) {
                  if (line.startsWith("event:")) eventType = line.slice(6).trim();
                  else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
                }
                if (!dataRaw) continue;
                try {
                  const data = JSON.parse(dataRaw);
                  // Map Anthropic events to our normalized SSE
                  // content_block_delta => text delta
                  if (eventType === "content_block_delta") {
                    const t = data?.delta?.type === 'text_delta' ? String(data?.delta?.text || '') : '';
                    if (t) {
                      assembledText += t;
                      send('delta', { text: t });
                    }
                  }
                  // message_start may contain input token usage depending on API version
                  if (eventType === "message_start") {
                    const it = Number(data?.message?.usage?.input_tokens ?? 0);
                    if (it > 0) inputTokens = it;
                  }
                  // message_delta may include output token increments; sum if present
                  if (eventType === "message_delta") {
                    const ot = Number(data?.delta?.usage?.output_tokens ?? 0);
                    if (!Number.isNaN(ot) && ot > 0) outputTokens += ot;
                  }
                  // content_block_stop or message_stop carry no text; ignore
                } catch (_) {
                  // ignore malformed chunk
                }
              }
            };

            for (;;) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              flushBlocks();
            }
            // Flush any trailing block
            flushBlocks();

            // Usage fallback: if outputTokens not captured via deltas, keep 0; server still counts 1 request
            // Log usage (count request) after success
            if (userId) {
              try {
                await admin.from('ai_usage_logs').insert({
                  user_id: userId,
                  feature,
                  tokens_used: Number(inputTokens || 0) + Number(outputTokens || 0),
                  created_at: new Date().toISOString(),
                  model,
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
              } catch (e) {
                console.error('Failed to log AI usage (stream):', e);
              }
            }

            // Send compatibility 'final' then normalized 'done'
            send('final', {
              success: true,
              content: assembledText,
              usage: { inputTokens, outputTokens },
              overage: overageApplied ? { charged: true, amount: overageAmount } : { charged: false },
              quota_charged: true,
              model,
            });
            send('done', { finish_reason: 'stop', usage: { input_tokens: inputTokens, output_tokens: outputTokens } });
            controller.close();
          } catch (err) {
            console.error('SSE stream error:', err);
            // Do not charge on error
            send('done', { error: true, message: 'AI service temporarily unavailable. This request was not counted against your quota.' });
            controller.close();
          }
        }
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      });
    }
    
    let aiRes;
    let contentText = "";
    let inputTokens = 0;
    let outputTokens = 0;
    let tokensUsed = 0;
    let requestSucceeded = false;
    
    try {
      aiRes = await callAnthropic(ANTHROPIC_API_KEY, contentParts ?? [{ type: 'text', text: String(prompt || '') }], model, options);
      
      // Extract content and token usage
      const contentItem = aiRes?.content?.[0];
      contentText = contentItem?.type === "text" ? String(contentItem.text || "") : "";
      inputTokens = Number(aiRes?.usage?.input_tokens ?? 0);
      outputTokens = Number(aiRes?.usage?.output_tokens ?? 0);
      tokensUsed = inputTokens + outputTokens;
      
      // Mark as successful only if we got valid content
      requestSucceeded = !!contentText && contentText.trim().length > 0;
      
    } catch (anthropicError) {
      // AI request failed - don't log usage or charge
console.error('Anthropic API request failed:', anthropicError);
return json({ 
        success: false, 
        error: 'AI service temporarily unavailable. This request was not counted against your quota.',
        code: 'AI_SERVICE_ERROR',
        error_type: 'network',
        quota_charged: false
      }, 500, corsHeaders);
    }
    
    // Only log usage if the AI request was successful
    if (requestSucceeded && userId) {
      try {
        await admin.from("ai_usage_logs").insert({
          user_id: userId,
          feature,
          tokens_used: tokensUsed,
          created_at: new Date().toISOString(),
          model: model,
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
      } catch (dbError) {
        // Log database error but still return success if AI worked
        console.error('Failed to log AI usage (request succeeded):', dbError);
      }
    }
    
    // Return result with quota charging information
    if (!requestSucceeded) {
return json({ 
        success: false, 
        error: 'AI generated invalid response. This request was not counted against your quota.',
        code: 'INVALID_AI_RESPONSE',
        error_type: 'unknown',
        quota_charged: false
      }, 500, corsHeaders);
    }

    return json({ 
      success: true, 
      content: contentText, 
      usage: { inputTokens, outputTokens }, 
      overage: overageApplied ? { charged: true, amount: overageAmount } : { charged: false },
      quota_charged: true,
      model,
      attachment_index: attachmentIndex,
      attachment_limits: { per_file: maxTextCharsPerFile, total: maxTextCharsTotal }
    }, 200, corsHeaders);
  } catch (e) {
    console.error("ai-proxy error:", e);
return json({ success: false, error: (e as Error).message || String(e), code: 'PROXY_ERROR', error_type: 'unknown', quota_charged: false }, 500, corsHeaders);
  }
});

