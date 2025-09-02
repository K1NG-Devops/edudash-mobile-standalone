import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import { changeAppLanguage, initI18n } from '@/src/i18n';
import { LanguageCode, SA_LANGUAGES, toSupportedLang, getLanguage } from '@/src/i18n/languages';

// Re-export types for backward compatibility
export type { LanguageCode } from '@/src/i18n/languages';
export { SA_LANGUAGES } from '@/src/i18n/languages';

function getDefaultLanguage(): LanguageCode {
  // Try to get device language first
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const deviceLocale = locales[0].languageTag;
    return toSupportedLang(deviceLocale);
  }
  // Default to English if we can't determine device language
  return 'en';
}

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  languages: typeof SA_LANGUAGES;
  getLabel: (code: LanguageCode) => string;
  isInitialized: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }>
  = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(getDefaultLanguage());
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize i18n and load persisted language
  useEffect(() => {
    (async () => {
      try {
        // Initialize i18n first
        await initI18n();
        
        // Then check for saved language preference
        const mod = await import('@/lib/utils/storage');
        const saved = await mod.StorageUtil.getItem('app_language');
        if (saved && (SA_LANGUAGES.some(l => l.code === (saved as LanguageCode)))) {
          setLanguageState(saved as LanguageCode);
          await changeAppLanguage(saved as LanguageCode);
        }
        
        setIsInitialized(true);
      } catch (error) {
        // If initialization fails, still mark as initialized
        setIsInitialized(true);
      }
    })();
  }, []);

  // Update language and sync with i18n
  const setLanguage = async (lang: LanguageCode) => {
    try {
      // Update local state
      setLanguageState(lang);
      
      // Update i18n and persist
      const needsReload = await changeAppLanguage(lang);
      
      // Persist to storage
      const mod = await import('@/lib/utils/storage');
      await mod.StorageUtil.setItem('app_language', lang);
      
      // If RTL change requires reload, the UI will handle it
      if (needsReload) {
        // The Settings screen should show a reload prompt
      }
    } catch (error) {
      // Silently fail - language change is not critical
    }
  };

  const languages = useMemo(() => SA_LANGUAGES, []);
  
  const getLabel = (code: LanguageCode) => {
    const lang = getLanguage(code);
    return lang?.nativeName || code.toUpperCase();
  };

  const value = useMemo(
    () => ({ language, setLanguage, languages, getLabel, isInitialized }), 
    [language, isInitialized]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

