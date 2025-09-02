/**
 * i18n initialization and configuration
 * Integrates with expo-localization and react-i18next
 */

import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

// Import language metadata and helpers
import { LanguageCode, toSupportedLang, toLocaleTag, isRTL } from './languages';

// Import translation resources
import en from '../locales/en.json';
import af from '../locales/af.json';
import zu from '../locales/zu.json';

// Storage key for persisted language preference
const LANGUAGE_STORAGE_KEY = 'app_language';

/**
 * Get the device's preferred language
 */
function getDeviceLanguage(): LanguageCode {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const deviceLocale = locales[0].languageTag;
    return toSupportedLang(deviceLocale);
  }
  return 'en';
}

/**
 * Get the initial language (from storage or device)
 */
async function getInitialLanguage(): Promise<LanguageCode> {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang) {
      // Validate that it's a supported language
      const validLangs: LanguageCode[] = ['en', 'af', 'nr', 'xh', 'zu', 'nso', 'st', 'tn', 'ss', 've', 'ts'];
      if (validLangs.includes(storedLang as LanguageCode)) {
        return storedLang as LanguageCode;
      }
    }
  } catch {
    // Ignore storage errors
  }
  
  return getDeviceLanguage();
}

/**
 * Initialize i18n
 */
export async function initI18n(): Promise<void> {
  const initialLang = await getInitialLanguage();
  
  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        af: { translation: af },
        zu: { translation: zu },
        // Add stub resources for other languages (will fall back to English)
        nr: { translation: {} },
        xh: { translation: {} },
        nso: { translation: {} },
        st: { translation: {} },
        tn: { translation: {} },
        ss: { translation: {} },
        ve: { translation: {} },
        ts: { translation: {} }
      },
      lng: initialLang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false // React Native already escapes
      },
      returnNull: false,
      react: {
        useSuspense: false // Disable suspense for React Native
      },
      compatibilityJSON: 'v3' // For React Native compatibility
    });
  
  // Set up RTL if needed
  updateRTLSettings(initialLang);
}

/**
 * Update RTL settings based on language
 */
function updateRTLSettings(lang: LanguageCode): void {
  const shouldBeRTL = isRTL(lang);
  
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(shouldBeRTL);
    
    // Note: App will need to be reloaded for RTL changes to take effect
    // This will be handled by the UI when the language is changed
  }
}

/**
 * Change the app language
 */
export async function changeAppLanguage(lang: LanguageCode): Promise<boolean> {
  try {
    // Persist the selection
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    
    // Change i18n language
    await i18n.changeLanguage(lang);
    
    // Check if RTL settings need to change
    const currentRTL = I18nManager.isRTL;
    const newRTL = isRTL(lang);
    
    if (currentRTL !== newRTL) {
      updateRTLSettings(lang);
      // Return true to indicate that a reload is needed
      return true;
    }
    
    return false; // No reload needed
  } catch (error) {
    // Silently fail - language change is not critical
    return false;
  }
}

/**
 * Reload the app (for RTL changes)
 */
export async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
  } catch {
    // In development or when updates module is unavailable, ignore reload errors
  }
}

/**
 * Custom hook for translations with proper typing
 */
export function useT() {
  const { t, i18n: i18nInstance, ready } = useTranslation();
  
  return {
    t,
    i18n: i18nInstance,
    ready,
    language: i18nInstance.language as LanguageCode,
    changeLanguage: changeAppLanguage
  };
}

/**
 * Get the current language
 */
export function getCurrentLanguage(): LanguageCode {
  return (i18n.language || 'en') as LanguageCode;
}

/**
 * Get the current locale tag (e.g., 'en-ZA')
 */
export function getCurrentLocaleTag(): string {
  return toLocaleTag(getCurrentLanguage());
}

/**
 * Check if translations are ready
 */
export function isI18nReady(): boolean {
  return i18n.isInitialized;
}

// Export the i18n instance
export default i18n;
