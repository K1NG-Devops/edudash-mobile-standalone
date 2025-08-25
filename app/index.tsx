import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function IndexScreen() {
  useEffect(() => {
    // Check authentication and route accordingly
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const authId = sessionData.session?.user?.id;
        
        if (authId) {
          // User is authenticated, get their role and route to dashboard
          const getRole = async (id: string, attempts = 6, delayMs = 200): Promise<string | null> => {
            for (let i = 0; i < attempts; i++) {
              const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('auth_user_id', id)
                .single();
              if (profile?.role) return profile.role as string;
              await new Promise((r) => setTimeout(r, delayMs));
            }
            return null;
          };

          const role = await getRole(authId);
          if (role === 'superadmin') {
            router.replace('/screens/super-admin-dashboard');
            return;
          }
          router.replace('/(tabs)/dashboard');
          return;
        } else {
          // User not authenticated, show futuristic landing page
          router.replace('/landing');
          return;
        }
      } catch (error) {
        // Error occurred, default to landing page
        router.replace('/landing');
      }
    })();
  }, []);

  // Show loading state while routing
  return null;
}
