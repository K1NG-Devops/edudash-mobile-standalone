-- 2025-08-28: Normalize legacy message_type values so upcoming CHECK constraint passes
-- Non-destructive, idempotent data patch for production

begin;

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

