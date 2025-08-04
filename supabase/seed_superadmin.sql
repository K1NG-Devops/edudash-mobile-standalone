-- Seed superadmin account for local development
-- Email: superadmin@edudashpro.org.za
-- Password: #Olivia@17

-- First, create the auth user
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change_token_new,
    recovery_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_token_current,
    email_change,
    email_change_sent_at,
    email_change_confirm_status,
    banned_until,
    deleted_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'superadmin@edudashpro.org.za',
    crypt('#Olivia@17', gen_salt('bf')),
    now(),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Super Admin"}',
    false,
    now(),
    now(),
    now(),
    '',
    '',
    now(),
    0,
    null,
    null
) ON CONFLICT (id) DO NOTHING;

-- Then create the corresponding user profile
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    auth_user_id,
    is_active,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'superadmin@edudashpro.org.za',
    'Super Admin',
    'superadmin',
    '00000000-0000-0000-0000-000000000001'::uuid,
    true,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    auth_user_id = EXCLUDED.auth_user_id,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Create an auth.identities record for email authentication
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    email,
    id
) VALUES (
    'superadmin@edudashpro.org.za',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '{"sub": "00000000-0000-0000-0000-000000000001", "email": "superadmin@edudashpro.org.za", "email_verified": true, "phone_verified": false}'::jsonb,
    'email',
    now(),
    now(),
    now(),
    'superadmin@edudashpro.org.za',
    '00000000-0000-0000-0000-000000000001'::uuid
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Verify the account was created
SELECT 
    u.email,
    p.name,
    p.role,
    p.is_active
FROM auth.users u
JOIN public.users p ON u.id = p.auth_user_id
WHERE u.email = 'superadmin@edudashpro.org.za';
