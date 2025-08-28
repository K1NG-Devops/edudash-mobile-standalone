import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  // User preference for theme
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  // Resolved scheme applied to UI
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
  toggle: () => void;
  theme: {
    isDark: boolean;
    colors: {
      // Core palette (mirrors Colors[colorScheme])
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      error: string;
      background: string;
      surface: string;
      surfaceVariant: string;
      card: string;
      text: string;
      textSecondary: string;
      border: string;
      outline: string;
      tint: string;
      icon: string;
      tabIconDefault: string;
      tabIconSelected: string;
      link: string;
      // UI helpers
      shadow: string;
    };
  };
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

// Simple bridge so non-hook code (class components, services) can toggle theme
let externalSetter: ((scheme: 'light' | 'dark') => void) | null = null;
export const setGlobalColorScheme = (scheme: 'light' | 'dark') => externalSetter?.(scheme);

const STORAGE_KEY = 'ui_color_scheme'; // legacy key: stores 'light' | 'dark'
const PREFERENCE_KEY = 'ui_theme_preference'; // new key: 'system' | 'light' | 'dark'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Preference can be 'system' to follow device theme
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [colorScheme, setColorSchemeState] = useState<'light' | 'dark'>(
    (Appearance.getColorScheme() as 'light' | 'dark') || 'light'
  );

  // Keep a ref to active Appearance subscription so we can remove when preference changes
  const appearanceCleanupRef = useRef<null | (() => void)>(null);

  // Utility to resolve preference to concrete scheme
  const resolveScheme = (pref: ThemePreference, system: 'light' | 'dark' | null): 'light' | 'dark' => {
    if (pref === 'system') return (system || 'light');
    return pref;
  };

  useEffect(() => {
    // Listen for external theme-toggle events on Web only
    const handler = (e: any) => {
      const val = e?.detail;
      if (val === 'light' || val === 'dark') setColorScheme(val);
    };

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      typeof (window as any).addEventListener === 'function'
    ) {
      window.addEventListener('theme-toggle', handler as any);
    }

    // Load persisted preference and/or legacy scheme
    (async () => {
      try {
        let storedPref: string | null = null;
        let legacyScheme: string | null = null;

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            storedPref = window.localStorage.getItem(PREFERENCE_KEY);
            legacyScheme = window.localStorage.getItem(STORAGE_KEY);
          }
        } else {
          storedPref = await AsyncStorage.getItem(PREFERENCE_KEY);
          legacyScheme = await AsyncStorage.getItem(STORAGE_KEY);
        }

        let pref: ThemePreference = 'system';
        if (storedPref === 'system' || storedPref === 'light' || storedPref === 'dark') {
          pref = storedPref;
        } else if (legacyScheme === 'light' || legacyScheme === 'dark') {
          // Migrate legacy direct scheme to explicit preference
          pref = legacyScheme as ThemePreference;
        }

        const sys = (Appearance.getColorScheme() as 'light' | 'dark') || 'light';
        setPreferenceState(pref);
        setColorSchemeState(resolveScheme(pref, sys));
      } catch {
        const sys = (Appearance.getColorScheme() as 'light' | 'dark') || 'light';
        setPreferenceState('system');
        setColorSchemeState(sys);
      }
    })();

    return () => {
      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        typeof (window as any).removeEventListener === 'function'
      ) {
        window.removeEventListener('theme-toggle', handler as any);
      }
    };
  }, []);

  // Subscribe to system theme changes only when following system
  useEffect(() => {
    // Clean up existing subscription
    appearanceCleanupRef.current?.();
    appearanceCleanupRef.current = null;

    if (preference === 'system' && typeof Appearance?.addChangeListener === 'function') {
      const sub = Appearance.addChangeListener(({ colorScheme: sys }) => {
        if (sys === 'light' || sys === 'dark') setColorSchemeState(sys);
      });
      appearanceCleanupRef.current = () => sub.remove();
    }

    return () => {
      appearanceCleanupRef.current?.();
      appearanceCleanupRef.current = null;
    };
  }, [preference]);

  const persistPreference = async (pref: ThemePreference) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.setItem(PREFERENCE_KEY, pref);
      } else {
        await AsyncStorage.setItem(PREFERENCE_KEY, pref);
      }
    } catch {}
  };

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    const sys = (Appearance.getColorScheme() as 'light' | 'dark') || 'light';
    setColorSchemeState(resolveScheme(pref, sys));
    persistPreference(pref);
  };

  const setColorScheme = (scheme: 'light' | 'dark') => {
    // Setting an explicit scheme implies opting out of system
    setPreference('light' === scheme ? 'light' : 'dark');
  };

  // Update bridge each render so external callers can toggle theme cross-platform
  externalSetter = setColorScheme;

  const palette = Colors[colorScheme];

  const theme = useMemo(() => ({
    isDark: colorScheme === 'dark',
    colors: {
      primary: palette.primary,
      secondary: palette.secondary,
      success: palette.success,
      warning: palette.warning,
      error: palette.error,
      background: palette.background,
      surface: palette.surface,
      surfaceVariant: palette.surfaceVariant,
      card: palette.surface, // alias
      text: palette.text, // dark mode => white or very light gray per project rule
      textSecondary: palette.textSecondary,
      border: palette.outline,
      outline: palette.outline,
      tint: palette.tint,
      icon: palette.icon,
      tabIconDefault: palette.tabIconDefault,
      tabIconSelected: palette.tabIconSelected,
      link: palette.link,
      shadow: colorScheme === 'dark' ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.2)'
    },
  }), [colorScheme, palette]);

  const value = useMemo(() => ({
    preference,
    setPreference,
    colorScheme,
    setColorScheme,
    toggle: () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark'),
    theme,
    toggleTheme: () => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark'),
  }), [preference, colorScheme, theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
