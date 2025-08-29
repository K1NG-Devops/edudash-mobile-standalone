-- 2025-08-28: Align messages schema with app contract (DM support + safe defaults)
-- - Adds/ensures subject column (NOT NULL, default '')
-- - Standardizes id default to gen_random_uuid() (pgcrypto)
-- - Unifies message_type CHECK to allow ('direct','announcement','system','homework_discussion')
-- Notes:
-- - This migration is idempotent and non-destructive; no data is dropped.
-- - Run in staging first, then production.

begin;

-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto with schema extensions;

-- Standardize id default (avoid dependency on uuid-ossp)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='id'
  ) THEN
    ALTER TABLE public.messages
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Ensure subject column exists and is NOT NULL with default ''
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='subject'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN subject text;
  END IF;

  -- Backfill any NULLs to '' to satisfy NOT NULL
  UPDATE public.messages SET subject = '' WHERE subject IS NULL;

  -- Enforce default and NOT NULL
  ALTER TABLE public.messages
    ALTER COLUMN subject SET DEFAULT '';
  ALTER TABLE public.messages
    ALTER COLUMN subject SET NOT NULL;
END $$;

-- Unify message_type allowed values to match app contract
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop any existing CHECK constraints that mention message_type
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%message_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT %I', r.conname);
  END LOOP;

  -- Re-add a single canonical CHECK constraint
  ALTER TABLE public.messages
    ADD CONSTRAINT messages_message_type_check
    CHECK (message_type IN ('direct','announcement','system','homework_discussion'));
END $$;

commit;

