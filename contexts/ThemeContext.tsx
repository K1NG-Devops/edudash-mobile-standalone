import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// Simple bridge so non-hook code (class components, services) can toggle theme
let externalSetter: ((scheme: 'light' | 'dark') => void) | null = null;
export const setGlobalColorScheme = (scheme: 'light' | 'dark') => externalSetter?.(scheme);

const STORAGE_KEY = 'ui_color_scheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>(
    (Appearance.getColorScheme() as 'light' | 'dark') || 'light'
  );

  useEffect(() => {
    // Listen for external theme-toggle events on Web only
    const handler = (e: any) => {
      const val = e?.detail;
      if (val === 'light' || val === 'dark') setColorScheme(val);
    };

    // In RN (Hermes), window exists but lacks addEventListener; restrict to Web
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof (window as any).addEventListener === 'function'
    ) {
      window.addEventListener('theme-toggle', handler as any);
    }

    // On native, optionally track system theme changes
    let removeAppearanceSubscription: undefined | (() => void);
    if (Platform.OS !== 'web' && typeof Appearance?.addChangeListener === 'function') {
      const sub = Appearance.addChangeListener(({ colorScheme: sys }) => {
        if (sys === 'light' || sys === 'dark') setColorSchemeState(sys);
      });
      removeAppearanceSubscription = () => sub.remove();
    }

    // Load persisted preference
    (async () => {
      try {
        let stored: string | null = null;
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') stored = window.localStorage.getItem(STORAGE_KEY);
        } else {
          stored = await AsyncStorage.getItem(STORAGE_KEY);
        }
        if (stored === 'light' || stored === 'dark') setColorSchemeState(stored);
      } catch {}
    })();

    return () => {
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        typeof (window as any).removeEventListener === 'function'
      ) {
        window.removeEventListener('theme-toggle', handler as any);
      }
      removeAppearanceSubscription?.();
    };
  }, []);

  const setColorScheme = (scheme: 'light' | 'dark') => {
    setColorSchemeState(scheme);
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, scheme);
      } else {
        AsyncStorage.setItem(STORAGE_KEY, scheme);
      }
    } catch {}
  };

  // Update bridge each render so external callers can toggle theme cross-platform
  externalSetter = setColorScheme;

  const value = useMemo(() => ({
    colorScheme,
    setColorScheme,
    toggle: () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark'),
  }), [colorScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
