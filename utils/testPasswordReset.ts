import { supabase } from '@/lib/supabase';

/**
 * Test utility to verify password reset email generation
 * Use this to test if the deep link is properly configured
 */
export const testPasswordResetEmail = async (testEmail: string): Promise<void> => {
  console.log('🧪 Testing password reset email generation...');
  console.log('📧 Test email:', testEmail);
  console.log('🔗 Expected deep link: edudashpro://auth/reset-password');
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'edudashpro://auth/reset-password',
    });
    
    if (error) {
      console.error('❌ Error sending test email:', error);
      console.error('   - Message:', error.message);
      console.error('   - Status:', error.status);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('📋 Next steps:');
      console.log('   1. Check your email inbox');
      console.log('   2. Look for the reset link in the email');
      console.log('   3. Verify it starts with "edudashpro://"');
      console.log('   4. Click the link to test deep linking');
    }
  } catch (error) {
    console.error('❌ Exception during test:', error);
  }
};

/**
 * Test deep link handling (call this from your reset-password screen)
 */
export const testDeepLinkHandling = (params: any): void => {
  console.log('🧪 Testing deep link parameter handling...');
  console.log('📥 Received parameters:', {
    hasAccessToken: !!params.access_token,
    hasRefreshToken: !!params.refresh_token,
    hasToken: !!params.token,
    hasType: !!params.type,
    allKeys: Object.keys(params),
  });
  
  if (params.access_token && params.refresh_token) {
    console.log('✅ New-style auth tokens detected');
    console.log('   - Access token length:', params.access_token.length);
    console.log('   - Refresh token length:', params.refresh_token.length);
  } else if (params.token && params.type) {
    console.log('✅ Old-style OTP tokens detected');
    console.log('   - Token type:', params.type);
    console.log('   - Token length:', params.token.length);
  } else {
    console.log('❌ No valid auth parameters found');
    console.log('   - Make sure you clicked a valid reset link');
    console.log('   - Check Supabase redirect URL configuration');
  }
};
