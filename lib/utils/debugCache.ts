import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Debug utility to help identify caching issues
 */
export const debugCache = {
  /**
   * Log all cached data for debugging
   */
  async logAllCache() {
    console.log('🔍 [CACHE-DEBUG] Current cache state:');
    
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          const keys = Object.keys(window.localStorage);
          console.log('📱 [WEB] Total localStorage keys:', keys.length);
          
          const relevantKeys = keys.filter(key => 
            key.includes('supabase') || 
            key.includes('edudash') || 
            key.includes('auth') ||
            key.includes('userProfile')
          );
          
          if (relevantKeys.length > 0) {
            console.log('🔑 [WEB] Relevant cache keys:', relevantKeys);
            relevantKeys.forEach(key => {
              const value = window.localStorage.getItem(key);
              console.log(`   - ${key}:`, value?.substring(0, 100) + (value && value.length > 100 ? '...' : ''));
            });
          } else {
            console.log('✅ [WEB] No cached data found');
          }
        }
      } else {
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('📱 [MOBILE] Total AsyncStorage keys:', allKeys.length);
        
        const relevantKeys = allKeys.filter(key => 
          key.includes('supabase') || 
          key.includes('edudash') || 
          key.includes('auth') ||
          key.includes('userProfile')
        );
        
        if (relevantKeys.length > 0) {
          console.log('🔑 [MOBILE] Relevant cache keys:', relevantKeys);
          
          const values = await AsyncStorage.multiGet(relevantKeys);
          values.forEach(([key, value]) => {
            console.log(`   - ${key}:`, value?.substring(0, 100) + (value && value.length > 100 ? '...' : ''));
          });
        } else {
          console.log('✅ [MOBILE] No cached data found');
        }
      }
    } catch (error) {
      console.error('❌ [CACHE-DEBUG] Error reading cache:', error);
    }
  },

  /**
   * Check for specific profile data
   */
  async checkProfileCache() {
    try {
      let userProfile = null;
      
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          userProfile = window.localStorage.getItem('userProfile');
        }
      } else {
        userProfile = await AsyncStorage.getItem('userProfile');
      }
      
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        console.log('👤 [PROFILE-DEBUG] Cached profile found:');
        console.log('   - Name:', profile.name);
        console.log('   - Role:', profile.role);
        console.log('   - School ID:', profile.preschool_id);
        console.log('   - Active:', profile.is_active);
        console.log('   - Updated:', profile.updated_at);
      } else {
        console.log('✅ [PROFILE-DEBUG] No cached profile found');
      }
    } catch (error) {
      console.error('❌ [PROFILE-DEBUG] Error reading profile cache:', error);
    }
  },

  /**
   * Check auth tokens
   */
  async checkAuthTokens() {
    try {
      console.log('🔐 [AUTH-DEBUG] Checking auth tokens...');
      
      const tokenKeys = [
        'supabase.auth.token',
        'supabase_auth_client',
        'auth_token',
        'refresh_token'
      ];
      
      for (const key of tokenKeys) {
        try {
          let value = null;
          
          if (Platform.OS === 'web') {
            if (typeof window !== 'undefined' && window.localStorage) {
              value = window.localStorage.getItem(key);
            }
          } else {
            // Try both AsyncStorage and SecureStore
            value = await AsyncStorage.getItem(key);
            if (!value) {
              value = await SecureStore.getItemAsync(key);
            }
          }
          
          if (value) {
            console.log(`   - ${key}: Found (${value.length} chars)`);
          } else {
            console.log(`   - ${key}: Not found`);
          }
        } catch (error) {
          console.log(`   - ${key}: Error checking (${error.message})`);
        }
      }
    } catch (error) {
      console.error('❌ [AUTH-DEBUG] Error checking auth tokens:', error);
    }
  },

  /**
   * Clear all debug cache
   */
  async clearDebugCache() {
    console.log('🧹 [CACHE-DEBUG] Clearing all debug cache...');
    
    try {
      const keysToRemove = [
        'userProfile',
        'cached_dashboard_data',
        'debug_logs',
        'temp_data'
      ];

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          keysToRemove.forEach(key => {
            window.localStorage.removeItem(key);
          });
        }
      } else {
        await AsyncStorage.multiRemove(keysToRemove);
      }
      
      console.log('✅ [CACHE-DEBUG] Debug cache cleared');
    } catch (error) {
      console.error('❌ [CACHE-DEBUG] Error clearing debug cache:', error);
    }
  }
};

/**
 * Quick debug function to call from console or during development
 */
export const quickDebug = async () => {
  console.log('🔍 Starting quick cache debug...');
  await debugCache.logAllCache();
  await debugCache.checkProfileCache();
  await debugCache.checkAuthTokens();
  console.log('🏁 Quick cache debug complete');
};
