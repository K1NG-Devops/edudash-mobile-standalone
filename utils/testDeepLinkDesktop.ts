import { router } from 'expo-router';

/**
 * Desktop testing utility for password reset deep links
 * Use this to simulate deep link navigation on desktop/web
 */
export const simulatePasswordResetDeepLink = (
  accessToken?: string, 
  refreshToken?: string
) => {

  // Create mock parameters similar to what would come from a deep link
  const mockParams = {
    access_token: accessToken || 'mock_access_token_for_testing',
    refresh_token: refreshToken || 'mock_refresh_token_for_testing',
  };
  
  // Navigate to reset password screen with mock parameters
  const queryString = new URLSearchParams(mockParams).toString();
  const resetUrl = `/(auth)/reset-password?${queryString}`;

  try {
    router.push(resetUrl as any);

  } catch (error) {
    console.error('❌ Navigation failed:', error);
  }
};

/**
 * Extract real auth tokens from a password reset email for testing
 */
export const extractTokensFromEmail = (emailResetLink: string): { 
  accessToken?: string; 
  refreshToken?: string; 
  error?: string; 
} => {
  try {

    // Parse the URL to extract tokens
    const url = new URL(emailResetLink);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {

      return { accessToken, refreshToken };
    } else {
      const error = 'No valid tokens found in the link';
      console.error('❌', error);
      return { error };
    }
  } catch (error) {
    const errorMessage = 'Invalid URL format';
    console.error('❌', errorMessage, error);
    return { error: errorMessage };
  }
};

/**
 * Complete desktop testing workflow
 */
export const testPasswordResetFlowDesktop = (emailResetLink: string) => {

  // Extract tokens from the email link
  const { accessToken, refreshToken, error } = extractTokensFromEmail(emailResetLink);
  
  if (error) {
    console.error('❌ Cannot test - invalid email link:', error);
    return;
  }
  
  // Simulate the deep link navigation
  simulatePasswordResetDeepLink(accessToken, refreshToken);
};
