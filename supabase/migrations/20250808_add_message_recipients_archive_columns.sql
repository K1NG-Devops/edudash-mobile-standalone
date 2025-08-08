-- Add archive columns to message_recipients used by the app
begin;

alter table if exists public.message_recipients
  add column if not exists is_archived boolean default false,
  add column if not exists archived_at timestamptz;

commit;


