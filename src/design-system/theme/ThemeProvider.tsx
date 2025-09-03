/**
 * Enhanced Theme Provider with NativeWind Integration
 * Manages light/dark theme switching with persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Appearance, ColorSchemeName, useColorScheme as useDeviceColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { lightColors, darkColors } from '../tokens/colors';

// Theme context types
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  colors: typeof lightColors;
  isDark: boolean;
}

// Storage key for theme persistence
const THEME_STORAGE_KEY = '@edudash/theme';

// Create the context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Theme Provider Component
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Resolve the actual theme (light or dark) based on theme setting
  const resolvedTheme: ResolvedTheme = theme === 'system' 
    ? (deviceColorScheme || 'light')
    : theme;

  const isDark = resolvedTheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Apply theme to system UI
  useEffect(() => {
    const applySystemUITheme = async () => {
      try {
        // Set the root background color
        await SystemUI.setBackgroundColorAsync(colors.background);
        
        // Only works on Android - set navigation bar style
        if (Platform.OS === 'android') {
          // Navigation bar button color
          (SystemUI as any).setNavigationBarStyleAsync?.(isDark ? 'light' : 'dark')?.catch?.(() => {});
        }
      } catch (error) {
        console.error('Failed to apply system UI theme:', error);
      }
    };

    if (!isLoading) {
      applySystemUITheme();
      
      // Apply NativeWind dark mode class
      // This will be handled by the root view wrapper
      if (typeof document !== 'undefined') {
        // Web only
        document.documentElement.classList.toggle('dark', isDark);
      }
    }
  }, [isDark, colors.background, isLoading]);

  // Set theme and persist to storage
  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only update if using system theme
      if (theme === 'system') {
        // Force re-render to update resolved theme
        setThemeState('system');
      }
    });

    return () => subscription?.remove();
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    colors,
    isDark,
  };

  // Don't render children until theme is loaded to avoid flash
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Utility hook to get theme-aware styles
export function useThemeStyles<T extends Record<string, any>>(
  stylesFn: (colors: typeof lightColors, isDark: boolean) => T
): T {
  const { colors, isDark } = useTheme();
  return React.useMemo(() => stylesFn(colors, isDark), [colors, isDark, stylesFn]);
}

