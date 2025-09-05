import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Edge Function: update-events-status
// - Sets events.status based on start_date/end_date
// - Intended to be scheduled every 15 minutes (via Supabase Scheduler)
//
// Scheduling (CLI):
//   supabase functions deploy update-events-status
//   supabase functions schedule create update-events-status --cron "0/15 * * * *" --endpoint "/update-events-status"
//   (tip: "*/15" is also common, but avoid including the '*/' sequence inside block comments)

serve(async () => {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVER_SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceRole) {
      return json({ error: "Service not configured" }, 500);
    }

    const admin = createClient(url, serviceRole, { auth: { persistSession: false } });

    const nowIso = new Date().toISOString();

    // Ongoing: with end_date
    await admin
      .from('events')
      .update({ status: 'ongoing', updated_at: nowIso })
      .neq('status', 'cancelled')
      .lte('start_date', nowIso)
      .gte('end_date', nowIso)
      .neq('status', 'ongoing')
      .catch(() => null);

    // Ongoing: without end_date
    await admin
      .from('events')
      .update({ status: 'ongoing', updated_at: nowIso })
      .neq('status', 'cancelled')
      .lte('start_date', nowIso)
      .is('end_date', null)
      .neq('status', 'ongoing')
      .catch(() => null);

    // Completed: with end_date
    await admin
      .from('events')
      .update({ status: 'completed', updated_at: nowIso })
      .neq('status', 'cancelled')
      .lt('end_date', nowIso)
      .neq('status', 'completed')
      .catch(() => null);

    // Completed: without end_date (past start)
    await admin
      .from('events')
      .update({ status: 'completed', updated_at: nowIso })
      .neq('status', 'cancelled')
      .is('end_date', null)
      .lt('start_date', nowIso)
      .neq('status', 'completed')
      .catch(() => null);

    // Upcoming: before start
    await admin
      .from('events')
      .update({ status: 'upcoming', updated_at: nowIso })
      .neq('status', 'cancelled')
      .gt('start_date', nowIso)
      .neq('status', 'upcoming')
      .catch(() => null);

    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

