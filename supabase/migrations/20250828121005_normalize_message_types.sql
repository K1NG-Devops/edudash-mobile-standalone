-- 2025-08-28: Normalize legacy message_type values so upcoming CHECK constraint passes
-- Non-destructive, idempotent data patch for production

begin;

-- Drop any existing CHECK constraints on message_type to allow normalization
DO $$
DECLARE r record;
BEGIN
  FOR r IN (
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.messages'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%message_type%'
  ) LOOP
    EXECUTE format('ALTER TABLE public.messages DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

-- Map legacy/unsupported types to the new canonical set
-- private, group, general -> direct
UPDATE public.messages
SET message_type = 'direct'
WHERE message_type IN ('private','group','general');

-- emergency -> system
UPDATE public.messages
SET message_type = 'system'
WHERE message_type = 'emergency';

commit;

