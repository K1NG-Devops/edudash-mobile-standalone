-- Event statuses updater
-- Marks events as upcoming/ongoing/completed based on time.
-- Safe: does not touch cancelled events.

create or replace function public.update_event_statuses()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ongoing: between start and end
  update public.events
    set status = 'ongoing', updated_at = now()
  where status <> 'cancelled'
    and start_date <= now()
    and end_date is not null
    and end_date >= now()
    and status is distinct from 'ongoing';

  -- Ongoing: start passed, no end
  update public.events
    set status = 'ongoing', updated_at = now()
  where status <> 'cancelled'
    and start_date <= now()
    and end_date is null
    and status is distinct from 'ongoing';

  -- Completed: now past end
  update public.events
    set status = 'completed', updated_at = now()
  where status <> 'cancelled'
    and end_date is not null
    and end_date < now()
    and status is distinct from 'completed';

  -- Completed: no end_date, now past start
  update public.events
    set status = 'completed', updated_at = now()
  where status <> 'cancelled'
    and end_date is null
    and start_date < now()
    and status is distinct from 'completed';

  -- Upcoming: before start
  update public.events
    set status = 'upcoming', updated_at = now()
  where status <> 'cancelled'
    and start_date > now()
    and status is distinct from 'upcoming';
end;
$$;

-- Try to enable pg_cron and schedule job if possible (will no-op if not permitted)
create extension if not exists pg_cron with schema extensions;

-- Schedule every 15 minutes
-- Note: On some Supabase projects, only the 'postgres' role can schedule jobs.
-- If this statement fails during migration, create the schedule manually in the dashboard.
select cron.schedule('every-15min-event-status', '*/15 * * * *', $$select public.update_event_statuses();$$)
where not exists (select 1 from cron.job where jobname = 'every-15min-event-status');

