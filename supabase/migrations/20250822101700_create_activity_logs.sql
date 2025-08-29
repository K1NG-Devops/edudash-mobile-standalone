-- Create minimal activity_logs table used by send-email edge function
create table if not exists public.activity_logs (
  id bigserial primary key,
  activity_type text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

comment on table public.activity_logs is 'Generic activity log entries (populated by edge functions).';

