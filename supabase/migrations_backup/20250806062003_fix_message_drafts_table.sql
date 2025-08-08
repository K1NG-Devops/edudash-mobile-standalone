-- Fix message_drafts table structure
-- The table exists but is missing the author_id column

-- First drop the existing RLS policy if it exists
DROP POLICY IF EXISTS "users_can_manage_own_drafts" ON public.message_drafts;

-- Add the missing author_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'message_drafts' 
                   AND column_name = 'author_id') THEN
        ALTER TABLE public.message_drafts 
        ADD COLUMN author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'message_drafts' 
                   AND column_name = 'preschool_id') THEN
        ALTER TABLE public.message_drafts 
        ADD COLUMN preschool_id uuid NOT NULL REFERENCES public.preschools(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Recreate the RLS policy with the correct column
CREATE POLICY "users_can_manage_own_drafts" ON public.message_drafts
  FOR ALL TO authenticated
  USING (author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()))
  WITH CHECK (author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));
