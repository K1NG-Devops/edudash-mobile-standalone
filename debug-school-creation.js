/**
 * Debug script to test school creation step by step
 * Run with: node --experimental-modules debug-school-creation.js
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function debugSchoolCreation() {
  const schoolData = {
    name: "Young Eagles Debug Test",
    email: "debug-test@youngeagles.org.za", 
    admin_name: "Annatjie Makunyane",
    subscription_plan: "trial"
  };

  console.log('🏫 [DEBUG] Starting school creation:', schoolData);

  try {
    console.log('Step 1: Creating school record...');
    
    // Step 1: Create school record
    const { data: schoolRecord, error: schoolError } = await supabase
      .from('preschools')
      .insert({
        name: schoolData.name,
        email: schoolData.email,
        subscription_plan: schoolData.subscription_plan || 'trial',
        subscription_status: 'active',
        tenant_slug: schoolData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
        onboarding_status: 'completed',
        setup_completed: true
      })
      .select('*')
      .single();

    if (schoolError) {
      console.error('❌ [DEBUG] School creation failed:', schoolError);
      return;
    }

    console.log('✅ [DEBUG] School record created:', schoolRecord.id);

    // Step 2: Create auth user
    console.log('Step 2: Creating auth user...');
    const tempPassword = `EduDash${Math.random().toString(36).slice(-8)}!`;
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: schoolData.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: schoolData.admin_name,
        role: 'principal',
        school_id: schoolRecord.id,
        school_name: schoolData.name,
        created_via: 'debug_test'
      }
    });

    if (authError) {
      console.error('❌ [DEBUG] Auth user creation failed:', authError);
      console.log('Rolling back school record...');
      await supabase.from('preschools').delete().eq('id', schoolRecord.id);
      return;
    }

    console.log('✅ [DEBUG] Auth user created:', authUser.user?.id);

    // Step 3: Update user profile (created by trigger) with school info
    console.log('Step 3: Updating user profile with school info...');
    const { error: userError } = await supabase
      .from('users')
      .update({
        name: schoolData.admin_name,
        role: 'principal', 
        preschool_id: schoolRecord.id,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', authUser.user.id);

    if (userError) {
      console.error('❌ [DEBUG] User profile update failed:', userError);
      console.log('Rolling back auth user and school...');
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('preschools').delete().eq('id', schoolRecord.id);
      return;
    }

    console.log('✅ [DEBUG] User profile updated successfully');

    // Step 4: Test email sending (optional - will likely fail in local env without proper config)
    console.log('Step 4: Testing email function (may fail)...');
    try {
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: schoolData.email,
          subject: '[DEBUG TEST] EduDash Pro Test Email',
          html: `<h1>Debug Test</h1><p>This is a test email for ${schoolData.name}</p><p>Temp password: ${tempPassword}</p>`,
          templateType: 'test',
          schoolName: schoolData.name,
          principalName: schoolData.admin_name,
        }
      });

      if (emailError) {
        console.warn('⚠️ [DEBUG] Email function failed (expected in local env):', emailError);
      } else {
        console.log('✅ [DEBUG] Email sent successfully:', emailData);
      }
    } catch (emailError) {
      console.warn('⚠️ [DEBUG] Email function error (expected in local env):', emailError.message);
    }

    console.log('🎉 [DEBUG] School creation completed successfully!');
    console.log(`🔑 [DEBUG] Temporary password: ${tempPassword}`);
    
    return { 
      success: true, 
      school_id: schoolRecord.id,
      admin_email: schoolData.email,
      temp_password: tempPassword
    };

  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

// Run the debug test
debugSchoolCreation().then(result => {
  console.log('Final result:', result);
});
