-- Add future-proof columns to school_invitation_codes (idempotent)
alter table if exists public.school_invitation_codes
  add column if not exists description text,
  add column if not exists metadata jsonb default '{}'::jsonb;

-- Helpful index for code search is already present; ensure metadata is jsonb
comment on column public.school_invitation_codes.metadata is 'Arbitrary JSON metadata for future needs (e.g., campaign, channel)';
