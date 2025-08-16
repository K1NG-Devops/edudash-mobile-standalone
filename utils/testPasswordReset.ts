import { supabase } from '@/lib/supabase';

/**
 * Test utility to verify password reset email generation
 * Use this to test if the deep link is properly configured
 */
export const testPasswordResetEmail = async (testEmail: string): Promise<void> => {

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'edudashpro://auth/reset-password',
    });
    
    if (error) {
      console.error('❌ Error sending test email:', error);
      console.error('   - Message:', error.message);
      console.error('   - Status:', error.status);
    } else {

    }
  } catch (error) {
    console.error('❌ Exception during test:', error);
  }
};

/**
 * Test deep link handling (call this from your reset-password screen)
 */
export const testDeepLinkHandling = (params: any): void => {

  console.log('📥 Received parameters:', {
    hasAccessToken: !!params.access_token,
    hasRefreshToken: !!params.refresh_token,
    hasToken: !!params.token,
    hasType: !!params.type,
    allKeys: Object.keys(params),
  });
  
  if (params.access_token && params.refresh_token) {

  } else if (params.token && params.type) {

  } else {

  }
};
