import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Clear all cached app data including user profiles and auth tokens
 * This is useful for debugging stale data issues
 */
export const clearAppCache = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🧹 Clearing app cache...');

    const keysToRemove = [
      'userProfile',
      'supabase_auth_client',
      'supabase_auth_admin',
      '@auth_storage_key',
      'cached_dashboard_data',
      'cached_students',
      'cached_classes',
      'cached_teachers',
      'cached_parents',
    ];

    if (Platform.OS === 'web') {
      // Clear web localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        keysToRemove.forEach(key => {
          window.localStorage.removeItem(key);
        });
        
        // Also clear any keys that contain 'supabase' or 'edudash'
        const allKeys = Object.keys(window.localStorage);
        allKeys.forEach(key => {
          if (key.includes('supabase') || key.includes('edudash') || key.includes('auth')) {
            window.localStorage.removeItem(key);
          }
        });
      }
    } else {
      // Clear React Native AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToDelete = allKeys.filter(key => 
        keysToRemove.includes(key) || 
        key.includes('supabase') || 
        key.includes('edudash') || 
        key.includes('auth')
      );

      if (keysToDelete.length > 0) {
        await AsyncStorage.multiRemove(keysToDelete);
      }

      // Clear SecureStore items (auth tokens)
      for (const key of keysToRemove) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Key might not exist, that's fine
        }
      }

      // Clear specific auth-related secure items
      const secureKeysToRemove = [
        'supabase.auth.token',
        'supabase_auth_client',
        'auth_token',
        'refresh_token',
      ];

      for (const key of secureKeysToRemove) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Key might not exist, that's fine
        }
      }
    }

    console.log('✅ App cache cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear app cache:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Clear only user profile cache (lighter operation)
 */
export const clearUserProfileCache = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('👤 Clearing user profile cache...');

    const profileKeys = [
      'userProfile',
      'cached_dashboard_data',
    ];

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        profileKeys.forEach(key => {
          window.localStorage.removeItem(key);
        });
      }
    } else {
      await AsyncStorage.multiRemove(profileKeys);
    }

    console.log('✅ User profile cache cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to clear user profile cache:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Get cache statistics for debugging
 */
export const getCacheStats = async () => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        const relevantKeys = keys.filter(key => 
          key.includes('supabase') || 
          key.includes('edudash') || 
          key.includes('auth') ||
          key.includes('userProfile')
        );
        
        return {
          platform: 'web',
          totalKeys: keys.length,
          relevantKeys: relevantKeys.length,
          keys: relevantKeys
        };
      }
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const relevantKeys = allKeys.filter(key => 
        key.includes('supabase') || 
        key.includes('edudash') || 
        key.includes('auth') ||
        key.includes('userProfile')
      );

      return {
        platform: 'mobile',
        totalKeys: allKeys.length,
        relevantKeys: relevantKeys.length,
        keys: relevantKeys
      };
    }

    return {
      platform: 'unknown',
      totalKeys: 0,
      relevantKeys: 0,
      keys: []
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return {
      platform: 'error',
      totalKeys: 0,
      relevantKeys: 0,
      keys: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
