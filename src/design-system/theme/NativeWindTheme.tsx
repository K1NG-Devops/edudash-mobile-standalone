/**
 * NativeWind Theme Wrapper
 * Applies the dark class for NativeWind based on theme
 */

import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from './ThemeProvider';

interface NativeWindThemeProps extends ViewProps {
  children: React.ReactNode;
}

export function NativeWindTheme({ children, className = '', style, ...props }: NativeWindThemeProps) {
  const { isDark, colors } = useTheme();

  return (
    <View 
      className={`flex-1 ${isDark ? 'dark' : ''} ${className}`}
      style={[
        { backgroundColor: colors.background },
        style
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

// Export a utility to conditionally apply dark-mode classes
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Utility function for dark mode specific classes
export function useDarkModeClasses(lightClasses: string, darkClasses: string): string {
  const { isDark } = useTheme();
  return isDark ? darkClasses : lightClasses;
}
