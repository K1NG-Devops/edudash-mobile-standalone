begin;

-- Add convenience boolean columns while preserving existing timestamp fields
alter table if exists public.message_recipients
  add column if not exists is_read boolean not null default false,
  add column if not exists is_archived boolean not null default false;

-- Backfill from existing timestamps
update public.message_recipients set is_read = true where read_at is not null;
update public.message_recipients set is_archived = true where archived_at is not null;

-- Optional: lightweight indexes used by unread/archived filters
create index if not exists idx_message_recipients_unread on public.message_recipients(recipient_id) where is_read = false;
create index if not exists idx_message_recipients_not_archived on public.message_recipients(recipient_id) where is_archived = false;

-- Do NOT enforce strict sync constraints yet because some code paths may only set timestamps.
-- We can add CHECK constraints later once all clients update both fields consistently.

commit;
