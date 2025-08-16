import { createLogger } from '@/lib/utils/logger';
import { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Debug environment variables (gated behind debug flag)
const DEBUG_SUPABASE = process.env.EXPO_PUBLIC_DEBUG_SUPABASE === 'true';
const log = createLogger('supabase');
if (DEBUG_SUPABASE) {
  log.debug('🔧 Supabase Config Debug:');
  log.debug('- EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Found' : '❌ Missing');
  log.debug('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
  log.debug('- EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing');
}

// Use production database for authentication
const USE_LOCAL_DB = false;

// Log current configuration for debugging
console.log('🔧 Supabase Configuration:', {
  USE_LOCAL_DB,
  url: USE_LOCAL_DB ? 'LOCAL' : 'PRODUCTION',
  hasEnvUrl: !!process.env.EXPO_PUBLIC_SUPABASE_URL,
  hasEnvKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
});

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || (USE_LOCAL_DB ? 'http://127.0.0.1:54321' : '');

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || (USE_LOCAL_DB ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' : '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase configuration missing!');
  if (DEBUG_SUPABASE) {
    log.error('URL:', supabaseUrl);
    log.error('Key available:', !!supabaseAnonKey);
  }
} else if (DEBUG_SUPABASE) {
  log.debug('✅ Supabase configuration loaded');
  log.debug('URL:', supabaseUrl);
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
    storageKey: 'supabase_auth_client',
  },
});

// Admin client for service role operations (development only)
// WARNING: This exposes the service role key to the client - only for development!
const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || (USE_LOCAL_DB
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  : undefined);

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: 'supabase_auth_admin',
    },
  })
  : null;

if (DEBUG_SUPABASE) {
  if (supabaseServiceRoleKey) {
    log.debug('✅ Supabase Admin client configured with service role');
    log.debug('🔑 Service role key (first 20 chars):', supabaseServiceRoleKey.substring(0, 20) + '...');
  } else {
    log.warn('⚠️ Service role key not found - admin operations will not work');
    log.debug('🔍 Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  }
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

// Expose clients globally for debugging (development only)
if (typeof window !== 'undefined' && DEBUG_SUPABASE) {
  (window as any).supabaseClients = {
    supabase,
    supabaseAdmin
  };
  console.log('🔧 [Debug] Supabase clients exposed globally for debugging');
}
