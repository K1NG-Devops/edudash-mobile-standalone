-- Idempotent compatibility patch for teacher invite flow
-- Ensures invitation_codes and school_invitation_codes have expected columns
-- and creates minimal RPCs used by the app.

-- 1) Normalize invitation_codes columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='email'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='role'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN role text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='preschool_id'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN preschool_id uuid REFERENCES public.preschools(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='invited_by'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN invited_by uuid REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='expires_at'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN expires_at timestamptz DEFAULT (now() + interval '7 days');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='used_at'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN used_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='invitation_codes' AND column_name='used_by'
  ) THEN
    ALTER TABLE public.invitation_codes ADD COLUMN used_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2) Normalize school_invitation_codes columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='preschool_id'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN preschool_id uuid REFERENCES public.preschools(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='code'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN code varchar(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='invitation_type'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN invitation_type varchar(20) DEFAULT 'teacher';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='invited_email'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN invited_email varchar(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='invited_by'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN invited_by uuid REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='expires_at'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='used_at'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN used_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='used_by'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN used_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='max_uses'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN max_uses integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='current_uses'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN current_uses integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='is_active'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN is_active boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='created_at'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  -- optional columns used in app
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='description'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='school_invitation_codes' AND column_name='metadata'
  ) THEN
    ALTER TABLE public.school_invitation_codes ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- 3) Create RPCs used by app when possible
-- generate_invitation_code(p_email text, p_role text, p_preschool_id uuid) returns text
CREATE OR REPLACE FUNCTION public.generate_invitation_code(
  p_email text,
  p_role text,
  p_preschool_id uuid
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := upper(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
  INSERT INTO public.invitation_codes(code, email, role, preschool_id)
  VALUES (v_code, p_email, p_role, p_preschool_id);
  RETURN v_code;
END;
$$;

-- use_invitation_code(p_code text, p_auth_user_id uuid, p_name text, p_phone text) returns uuid
CREATE OR REPLACE FUNCTION public.use_invitation_code(
  p_code text,
  p_auth_user_id uuid,
  p_name text,
  p_phone text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
  v_user_id uuid;
BEGIN
  SELECT * INTO v_invitation FROM public.invitation_codes
  WHERE code = p_code AND used_at IS NULL AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation code';
  END IF;

  INSERT INTO public.users(
    auth_user_id, email, name, phone, role, preschool_id, is_active, created_at, updated_at
  ) VALUES (
    p_auth_user_id, v_invitation.email, p_name, p_phone, v_invitation.role, v_invitation.preschool_id, true, now(), now()
  ) RETURNING id INTO v_user_id;

  UPDATE public.invitation_codes
  SET used_at = now(), used_by = p_auth_user_id
  WHERE id = v_invitation.id;

  RETURN v_user_id;
END;
$$;

