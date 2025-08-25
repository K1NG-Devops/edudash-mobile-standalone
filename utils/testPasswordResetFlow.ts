/**
 * Test utility to verify password reset functionality
 * This should be run in the browser console when testing password reset
 */

export const testPasswordResetFlow = async () => {

    // Check if we're on the reset password page
    const currentPath = window.location.pathname;
    if (!currentPath.includes('reset-password')) {
        console.warn('⚠️ Not on reset-password page. Current path:', currentPath);
        return;
    }

    // Check for hash parameters
    const hash = window.location.hash;

    if (hash && hash.includes('access_token') && hash.includes('type=recovery')) {

        // Parse tokens
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const tokenType = hashParams.get('type');

            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenType,
            accessTokenLength: accessToken?.length,
            refreshTokenLength: refreshToken?.length
        });

        // Check if supabase is available
        if (typeof window !== 'undefined' && (window as any).supabaseClients) {
            const { supabase } = (window as any).supabaseClients;

            const { data, error } = await supabase.auth.getSession();
                hasSession: !!data?.session,
                userId: data?.session?.user?.id,
                error: error?.message
            });
        } else {
        }
    } else {
    }
};

// Auto-run if in browser and debug mode
if (typeof window !== 'undefined' && process.env.EXPO_PUBLIC_DEBUG_SUPABASE === 'true') {
    // Run after a short delay to ensure page is loaded
    setTimeout(testPasswordResetFlow, 1000);
}

