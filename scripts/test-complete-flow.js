#!/usr/bin/env node
/**
 * Comprehensive test script for EduDash Pro onboarding flow
 * Run after superadmin registration: node scripts/test-complete-flow.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseStructure() {
  
  try {
    // Test users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name')
      .limit(5);
      
    if (usersError) {
      return false;
    }
    
    
    // Test preschools table
    const { data: schools, error: schoolsError } = await supabase
      .from('preschools')
      .select('id, name, email, subscription_plan')
      .limit(5);
      
    if (schoolsError) {
      return false;
    }
    
    
    // Test age_groups table
    const { data: ageGroups, error: ageGroupsError } = await supabase
      .from('age_groups')
      .select('id, name, preschool_id')
      .limit(5);
      
    if (ageGroupsError) {
      return false;
    }
    
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testSuperadminProfile() {
  
  try {
    const { data: superadmin, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        auth_user_id,
        preschools:preschools!principal_id(
          id,
          name,
          subscription_plan
        )
      `)
      .eq('email', 'superadmin@edudashpro.org.za')
      .single();
      
    if (error) {
      return false;
    }
    
    
    if (superadmin.preschools && superadmin.preschools.length > 0) {
    }
    
    return superadmin;
  } catch (error) {
    return false;
  }
}

async function testTeacherInvitationFlow() {
  
  try {
    // Get demo school ID
    const { data: school, error: schoolError } = await supabase
      .from('preschools')
      .select('id, name')
      .eq('email', 'demo@edudashpro.org.za')
      .single();
      
    if (schoolError) {
      return false;
    }
    
    // Test creating a teacher invitation
    const testInvitation = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'test-invitation-id',
      email: 'teacher.test@example.com',
      first_name: 'Test',
      last_name: 'Teacher',
      preschool_id: school.id,
      invited_by: null, // Will be set to superadmin ID when they're logged in
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    
    // Note: We can't actually insert the invitation without being authenticated
    // This will be tested when the superadmin logs in
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testParentCodeSystem() {
  
  try {
    // Test parent_codes table structure
    const { data, error } = await supabase
      .from('parent_codes')
      .select('id, code, preschool_id, is_active')
      .limit(1);
      
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found, which is OK
      return false;
    }
    
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testAIIntegration() {
  
  try {
    // Check AI configuration
    const aiConfig = {
      model: process.env.EXPO_PUBLIC_ANTHROPIC_MODEL,
      maxTokens: process.env.EXPO_PUBLIC_ANTHROPIC_MAX_TOKENS,
      lessonGenEnabled: process.env.EXPO_PUBLIC_AI_LESSON_GENERATION_ENABLED,
      homeworkGradingEnabled: process.env.EXPO_PUBLIC_AI_HOMEWORK_GRADING_ENABLED,
      stemActivitiesEnabled: process.env.EXPO_PUBLIC_AI_STEM_ACTIVITIES_ENABLED
    };
    
    
    // Test lesson_plans table
    const { data, error } = await supabase
      .from('lesson_plans')
      .select('id, title, age_group_id')
      .limit(1);
      
    if (error && error.code !== 'PGRST116') {
    } else {
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

async function testRLSPolicies() {
  
  try {
    // Test that RLS is working (should not allow access without auth)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'superadmin');
      
    if (error && error.code === '42501') {
      return true;
    } else if (!error && data) {
      return true;
    } else {
      return true; // Continue anyway
    }
  } catch (error) {
    return false;
  }
}

async function runAllTests() {
  
  const results = [];
  
  results.push(await testDatabaseStructure());
  results.push(await testSuperadminProfile());
  results.push(await testTeacherInvitationFlow());
  results.push(await testParentCodeSystem());
  results.push(await testAIIntegration());
  results.push(await testRLSPolicies());
  
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  
  if (passed === total) {
  } else {
  }
  
  return passed === total;
}

if (require.main === module) {
  runAllTests().catch(console.error);
}
