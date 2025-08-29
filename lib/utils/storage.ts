import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { logger as log } from '@/lib/utils/logger';

/**
 * Storage utility that works across React Native and web platforms
 * Uses AsyncStorage for React Native and localStorage for web
 */
export class StorageUtil {
  /**
   * Check if we're running on web platform
   */
  private static isWeb(): boolean {
    return Platform.OS === 'web' || typeof window !== 'undefined';
  }

  /**
   * Store data in storage
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb() && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      log.error(`Error storing item with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get data from storage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb() && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      log.error(`Error getting item with key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from storage
   */
  static async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb() && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      log.error(`Error removing item with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store JSON data
   */
  static async setJSON(key: string, value: any): Promise<void> {
    try {
      const jsonString = JSON.stringify(value);
      await this.setItem(key, jsonString);
    } catch (error) {
      log.error(`Error storing JSON with key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get JSON data
   */
  static async getJSON<T = any>(key: string, defaultValue: T): Promise<T> {
    try {
      const jsonString = await this.getItem(key);
      if (jsonString === null) {
        return defaultValue;
      }
      return JSON.parse(jsonString);
    } catch (error) {
      log.error(`Error getting JSON with key ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Clear all stored data
   */
  static async clear(): Promise<void> {
    try {
      if (this.isWeb() && typeof localStorage !== 'undefined') {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      log.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      if (this.isWeb() && typeof localStorage !== 'undefined') {
        return Object.keys(localStorage);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        return Array.isArray(keys) ? [...keys] : [];
      }
    } catch (error) {
      log.error('Error getting all keys:', error);
      return [];
    }
  }
}
