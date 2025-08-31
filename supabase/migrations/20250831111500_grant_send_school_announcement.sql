-- 2025-08-31: Grant EXECUTE on send_school_announcement to authenticated role
-- This enables logged-in users (e.g., principals) to call the RPC via PostgREST.
-- Safe/idempotent: guarded by a DO block to avoid duplicate grant errors.

begin;

DO $$
BEGIN
  -- Ensure function exists before granting
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'send_school_announcement'
      AND pg_get_function_arguments(p.oid) = 'p_content text, p_subject text DEFAULT ''::text, p_include_parents boolean DEFAULT true, p_include_staff boolean DEFAULT false, p_include_sender boolean DEFAULT true'
  ) THEN
    GRANT EXECUTE ON FUNCTION public.send_school_announcement(
      text, text, boolean, boolean, boolean
    ) TO authenticated;
  END IF;
END $$;

commit;
