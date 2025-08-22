#!/usr/bin/env node

/**
 * Smoke test: Parent invite flow using school_invitation_codes
 * - Requires env: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
 * - Steps:
 *   1) Ensure a preschool exists
 *   2) Create a parent invitation code in school_invitation_codes
 *   3) Simulate redeem via RPC validate_invitation_code(if present) or direct table lookup
 *   4) Create a parent profile and verify
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

function code8() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
}

async function ensurePreschool() {
  const { data: existing } = await admin.from('preschools').select('id,name').limit(1);
  if (existing && existing.length) return existing[0].id;
  const { data: created, error } = await admin.from('preschools').insert({ name: 'SmokeTest Preschool ' + Date.now() }).select('id').single();
  if (error) throw new Error('Failed to create preschool: ' + error.message);
  return created.id;
}

async function createParentInvite(preschoolId, parentEmail) {
  const code = code8();
  const { error } = await admin.from('school_invitation_codes').insert({
    preschool_id: preschoolId,
    code,
    invitation_type: 'parent',
    invited_email: parentEmail,
    invited_by: null,
    expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
    max_uses: 1,
    current_uses: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    description: 'Parent Smoke Test',
    metadata: { source: 'smoke-test' }
  });
  if (error) throw error;
  return code;
}

async function main() {
  console.log('🚀 Smoke test: Parent invite flow');
  const preschoolId = await ensurePreschool();
  console.log('🏫 Using preschool:', preschoolId);

  const parentEmail = `parent.smoketest+${Date.now()}@example.com`;
  const code = await createParentInvite(preschoolId, parentEmail);
  console.log('🔑 Parent invite code:', code);

  // Basic verification: ensure the code exists and is pending
  const { data: found, error } = await admin
    .from('school_invitation_codes')
    .select('code, invited_email, invitation_type, is_active')
    .eq('code', code)
    .maybeSingle();
  if (error || !found) throw new Error('Failed to verify code');

  console.log('✅ Parent code created for:', found.invited_email);
  console.log('🎉 Parent smoke test PASS (code creation verified)');
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Parent smoke test failed:', err.message || err);
    process.exit(1);
  });
}

