import React, { useEffect, useState } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function IndexScreen() {
  const [loadingState, setLoadingState] = useState('Initializing...');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // Wait until the root navigation tree is mounted to avoid REPLACE warnings
  const navState = useRootNavigationState();

  const addDebugInfo = (message: string) => {
    console.log('[IndexScreen]', message);
    setDebugInfo(prev => [...prev, message]);
  };

  useEffect(() => {
    if (!navState?.key) {
      setLoadingState('Waiting for navigation...');
      addDebugInfo('Navigation state not ready yet');
      return;
    }
    
    // Emergency fallback: skip auth check and go to landing if needed
    // Uncomment the next 3 lines to bypass authentication entirely for testing
    // addDebugInfo('Skipping auth check, going to landing');
    // router.replace('/landing');
    // return;
    
    // Check authentication and route accordingly
    (async () => {
      try {
        setLoadingState('Checking authentication...');
        addDebugInfo('Starting authentication check');
        addDebugInfo(`Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'}`);
        addDebugInfo(`Anon Key: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
        
        // Add timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout after 10 seconds')), 10000)
        );
        
        const { data: sessionData, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        addDebugInfo('Session check completed');
        
        if (sessionError) {
          addDebugInfo(`Session error: ${sessionError.message}`);
          setLoadingState('Session error, redirecting to landing...');
          setTimeout(() => router.replace('/landing'), 1000);
          return;
        }
        
        const authId = sessionData.session?.user?.id;
        addDebugInfo(`Auth ID: ${authId ? 'Found' : 'Not found'}`);
        
        if (authId) {
          setLoadingState('Getting user role...');
          // User is authenticated, get their role and route to dashboard
          const getRole = async (id: string, attempts = 6, delayMs = 200): Promise<string | null> => {
            for (let i = 0; i < attempts; i++) {
              addDebugInfo(`Role attempt ${i + 1}/${attempts}`);
              const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('role')
                .eq('auth_user_id', id)
                .single();
                
              if (profileError) {
                addDebugInfo(`Profile error: ${profileError.message}`);
              }
              
              if (profile?.role) {
                addDebugInfo(`Role found: ${profile.role}`);
                return profile.role as string;
              }
              await new Promise((r) => setTimeout(r, delayMs));
            }
            addDebugInfo('Role not found after all attempts');
            return null;
          };

          const role = await getRole(authId);
          if (role === 'superadmin') {
            setLoadingState('Redirecting to super-admin dashboard...');
            addDebugInfo('Redirecting to super-admin dashboard');
            setTimeout(() => router.replace('/screens/super-admin-dashboard'), 500);
            return;
          }
          setLoadingState('Redirecting to dashboard...');
          addDebugInfo('Redirecting to main dashboard');
          setTimeout(() => router.replace('/(tabs)/dashboard'), 500);
          return;
        } else {
          // User not authenticated, show futuristic landing page
          setLoadingState('Redirecting to landing page...');
          addDebugInfo('No authentication, redirecting to landing');
          setTimeout(() => router.replace('/landing'), 500);
          return;
        }
      } catch (error) {
        // Error occurred, default to landing page
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addDebugInfo(`Catch error: ${errorMessage}`);
        setLoadingState('Error occurred, redirecting to landing...');
        setTimeout(() => router.replace('/landing'), 1000);
      }
    })();
  }, [navState?.key]);

  // Show loading state while routing
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00f5ff" />
      <Text style={styles.loadingText}>{loadingState}</Text>
      
      {/* Debug info (only in development) */}
      {process.env.EXPO_PUBLIC_DEBUG_MODE === 'true' && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          {debugInfo.map((info, index) => (
            <Text key={index} style={styles.debugText}>
              {index + 1}. {info}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0f',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    maxHeight: 200,
    maxWidth: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00f5ff',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 4,
  },
});
