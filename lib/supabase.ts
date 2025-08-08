import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/types/database';

// Debug environment variables
console.log('🔧 Supabase Config Debug:');
console.log('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing');
console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
console.log('- EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');

// Set to true for local development testing
const USE_LOCAL_DB = false;

const supabaseUrl = USE_LOCAL_DB 
  ? 'http://127.0.0.1:54321'  // Local Supabase
  : (process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://lvvvjywrmpcqrpvuptdi.supabase.co');

const supabaseAnonKey = USE_LOCAL_DB
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'  // Local anon key
  : (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2dnZqeXdybXBjcXJwdnVwdGRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc4MzgsImV4cCI6MjA2ODYxMzgzOH0.mjXejyRHPzEJfMlhW46TlYI0qw9mtoSRJZhGsCkuvd8');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  console.error('URL:', supabaseUrl);
  console.error('Key available:', !!supabaseAnonKey);
} else {
  console.log('✅ Supabase configuration loaded');
  console.log('URL:', supabaseUrl);
}

// Enhanced AsyncStorage for Expo with SecureStore for sensitive data
// On web, fallback to localStorage
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      // On web, use localStorage
      if (typeof window !== 'undefined') {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    }
    
    // On mobile, use SecureStore for sensitive data, AsyncStorage for others
    if (key.includes('supabase.auth.token')) {
      return SecureStore.getItemAsync(key);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      // On web, use localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    
    // On mobile, use SecureStore for sensitive data, AsyncStorage for others
    if (key.includes('supabase.auth.token')) {
      return SecureStore.setItemAsync(key, value);
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      // On web, use localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        return Promise.resolve();
      }
      return Promise.resolve();
    }
    
    // On mobile, use SecureStore for sensitive data, AsyncStorage for others
    if (key.includes('supabase.auth.token')) {
      return SecureStore.deleteItemAsync(key);
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Admin client for service role operations (development only)
// WARNING: This exposes the service role key to the client - only for development!
const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (supabaseServiceRoleKey) {
  console.log('✅ Supabase Admin client configured with service role');
  console.log('🔑 Service role key (first 20 chars):', supabaseServiceRoleKey.substring(0, 20) + '...');
} else {
  console.warn('⚠️ Service role key not found - admin operations will not work');
  console.log('🔍 Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
}

// Helper function to get current user with role
export const getCurrentUserWithRole = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { user: null, profile: null, error: authError };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', user.id)
    .single();

  return { 
    user, 
    profile, 
    error: profileError 
  };
};

// Helper function to check if user has specific role
export const hasRole = (profile: any, role: string): boolean => {
  return profile?.role === role;
};

// Helper function to get user's school
export const getUserSchool = (profile: any) => {
  return profile?.schools;
};
