#!/usr/bin/env node

/**
 * Smoke test: Teacher invite flow
 * - Requires env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
 * - Steps:
 *   1) Create a teacher invitation via RPC (or fallback to inserting into school_invitation_codes)
 *   2) Create an auth user using the code by invoking the redeem-invitation edge function
 *   3) Verify the user profile exists with role 'teacher'
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing env: EXPO_PUBLIC_SUPABASE_URL and/or EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

function randomCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

async function ensureTestPreschool() {
  // Try to find any preschool; if none exists, create a test one
  const { data: existing } = await admin.from('preschools').select('id, name').limit(1);
  if (existing && existing.length > 0) return existing[0].id;
  const name = 'SmokeTest Preschool ' + Date.now();
  const { data: created, error } = await admin.from('preschools').insert({ name }).select('id').single();
  if (error) throw new Error('Failed to create preschool: ' + error.message);
  return created.id;
}

async function createInvitation(preschoolId, teacherEmail) {
  // Find any admin/superadmin user for invited_by
  let invitedBy = null;
  try {
    const { data: u1 } = await admin
      .from('users')
      .select('id')
      .in('role', ['superadmin','principal','admin','preschool_admin'])
      .limit(1);
    if (u1 && u1.length) invitedBy = u1[0].id;
  } catch (_) {}

  // If none found, create a minimal superadmin (last resort)
  if (!invitedBy) {
    const tmpEmail = `superadmin.smoketest+${Date.now()}@example.com`;
    const { data: authRes, error: authErr } = await admin.auth.admin.createUser({ email: tmpEmail, password: 'TempPass123!', email_confirm: true });
    if (!authErr && authRes?.user?.id) {
      const { data: newUser } = await admin
        .from('users')
        .insert({
          auth_user_id: authRes.user.id,
          email: tmpEmail,
          name: 'SmokeTest SuperAdmin',
          role: 'superadmin',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      invitedBy = newUser?.id || null;
    }
  }

  // Direct insert into invitation_codes (compatible with redeem-invitation fallback)
  const code = randomCode();
  const { error } = await admin
    .from('invitation_codes')
    .insert({
      code,
      email: teacherEmail,
      role: 'teacher',
      preschool_id: preschoolId,
      invited_by: invitedBy,
      expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
      created_at: new Date().toISOString(),
    });
  if (error) throw error;
  return code;
}

async function redeemInvitation(code, teacherName, teacherEmail) {
  // Use the edge function that the app calls; it will create auth user and profile
  const { data, error } = await admin.functions.invoke('redeem-invitation', {
    body: {
      code,
      email: teacherEmail,
      name: teacherName,
      // The function usually creates auth; but to keep parity, set a password
      password: 'TempPass123!'
    }
  });
  if (error) throw new Error('Edge function redeem-invitation error: ' + (error.message || JSON.stringify(error)));
  if (!data || !data.success) throw new Error('Redeem failed: ' + (data && data.error ? data.error : 'unknown'));
  return data;
}

async function verifyProfile(email) {
  const { data, error } = await admin.from('users').select('id, email, role, is_active').eq('email', email).maybeSingle();
  if (error) throw new Error('Verify profile error: ' + error.message);
  return data;
}

async function main() {
  console.log('🚀 Smoke test: Teacher invite flow');

  // 0) Prepare test inputs
  const TEST_EMAIL = `teacher.smoketest+${Date.now()}@example.com`;
  const TEST_NAME = 'Teacher SmokeTest';

  // 1) Ensure a preschool exists
  const preschoolId = await ensureTestPreschool();
  console.log('🏫 Using preschool:', preschoolId);

  // 2) Create invitation code
  const code = await createInvitation(preschoolId, TEST_EMAIL);
  console.log('🔑 Invitation code:', code);

  // 3) Redeem invitation via edge function
  try {
    const res = await redeemInvitation(code, TEST_NAME, TEST_EMAIL);
    console.log('✅ Redeemed invitation:', res);
  } catch (e) {
    console.error('❌ Redeem failed:', e.message || e);
    process.exit(1);
  }

  // 4) Verify profile exists and role is 'teacher'
  const profile = await verifyProfile(TEST_EMAIL);
  if (!profile) {
    console.error('❌ No profile found for', TEST_EMAIL);
    process.exit(1);
  }
  if (profile.role !== 'teacher') {
    console.error('❌ Profile role mismatch. Expected teacher, got', profile.role);
    process.exit(1);
  }
  console.log('🎉 Smoke test PASS. Profile:', profile);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('💥 Smoke test crashed:', err);
    process.exit(1);
  });
}

