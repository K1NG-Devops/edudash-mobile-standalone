#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Your current recovery token from the URL
const recoveryToken = 'eyJhbGciOiJIUzI1NiIsImtpZCI6Ind0eE41ZjV0eS9LQ2Vac3YiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2x2dnZqeXdybXBjcXJwdnVwdGRpLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJlODkxZGViYy1jNGE1LTQ5OWQtYTVkNy05NDI1YzlhOTg5YzUiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU2MDU3MTg0LCJpYXQiOjE3NTYwNTM1ODQsImVtYWlsIjoia2luZ0B5b3VuZ2VhZ2xlcy5vcmcuemEiLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImF1dGhfdXNlcl9pZCI6ImU4OTFkZWJjLWM0YTUtNDk5ZC1hNWQ3LTk0MjVjOWE5ODljNSIsImNyZWF0ZWRfYXQiOiIyMDI1LTA4LTIxVDA5OjIzOjM4LjkwMjM5NiswMDowMCIsImVtYWlsIjoia2luZ0B5b3VuZ2VhZ2xlcy5vcmcuemEiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaWQiOiJiN2Q2NzFjMS0wN2MyLTQ1MjMtYWU4My0zZjk4OTFkZjc2NWMiLCJpbnN0cnVjdGlvbnNfcmVzZW50X2F0IjoiMjAyNS0wOC0yMVQxMDo1NDo1Mi43MzlaIiwiaXNfYWN0aXZlIjp0cnVlLCJuYW1lIjoiS2luZyIsInBhc3N3b3JkX3Jlc2V0X3JlcXVpcmVkIjp0cnVlLCJwcmVzY2hvb2xfaWQiOiJlM2RjMzM1Ny03ZmYyLTRhN2QtOTBkZi1kNWYyZTM2ZjAxNzAiLCJwcm9maWxlX2NvbXBsZXRpb25fc3RhdHVzIjoiaW5jb21wbGV0ZSIsInJlc2VuZF9yZWFzb24iOiJBZG1pbiByZXF1ZXN0ZWQgcmVzZW5kIHZpYSBkYXNoYm9hcmQiLCJyb2xlIjoicHJpbmNpcGFsIiwidXBkYXRlZF9hdCI6IjIwMjUtMDgtMjFUMDk6MjM6MzkuMDk4MzcxKzAwOjAwIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoib3RwIiwidGltZXN0YW1wIjoxNzU2MDUzNTg0fV0sInNlc3Npb25faWQiOiJhM2JlYzVkMy1mOWQzLTQxNjQtOWQ2ZS1mNTA3NWQ2MWExMGEiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.YFE-A_zQ5u036kL6RhYIXp62v2TgUzYKiiudnlkEPak';

const supabase = createClient(supabaseUrl, supabaseKey);

async function useRecoveryToken() {
  
  try {
    // Set the session using the recovery token
    const { data, error } = await supabase.auth.setSession({
      access_token: recoveryToken,
      refresh_token: 'rjdjhe6dxtq3', // From your URL
    });
    
    if (error) {
      console.error('❌ Error setting session:', error.message);
      return false;
    }
    
    
    // Now update the password
    const newPassword = 'EduDash2024!'; // Choose a strong password
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (updateError) {
      console.error('❌ Password update failed:', updateError.message);
      return false;
    }
    
    
    return true;
    
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

async function main() {
  const success = await useRecoveryToken();
  
  if (success) {
  } else {
  }
}

main().catch(console.error);
