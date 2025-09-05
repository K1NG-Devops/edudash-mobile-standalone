/**
 * Theme Toggle Component
 * Provides UI for switching between light, dark, and system themes
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Sun, Moon, Monitor } from 'lucide-react-native';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ 
  className = '', 
  showLabel = false,
  size = 'md' 
}: ThemeToggleProps) {
  const { theme, setTheme, colors, isDark } = useTheme();

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const padding = size === 'sm' ? 8 : size === 'lg' ? 12 : 10;

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <View className={`flex-row rounded-lg bg-background-subtle p-1 ${className}`}>
      {themes.map(({ value, icon: Icon, label }) => {
        const isActive = theme === value;
        
        return (
          <TouchableOpacity
            key={value}
            onPress={() => setTheme(value)}
            className={`
              flex-row items-center justify-center rounded-md px-3 py-2
              ${isActive ? 'bg-primary' : 'bg-transparent'}
            `}
            style={{ 
              paddingHorizontal: padding,
              paddingVertical: padding - 2,
            }}
          >
            <Icon 
              size={iconSize}
              color={isActive ? colors.primaryForeground : colors.foregroundMuted}
            />
            {showLabel && (
              <Text 
                className={`ml-2 text-sm ${isActive ? 'text-primary-foreground' : 'text-foreground-muted'}`}
                style={{ color: isActive ? colors.primaryForeground : colors.foregroundMuted }}
              >
                {label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Compact theme toggle for headers
export function CompactThemeToggle() {
  const { theme, setTheme, colors } = useTheme();
  
  const nextTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

  return (
    <TouchableOpacity
      onPress={nextTheme}
      className="rounded-lg bg-background-element p-2"
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
    >
      <Icon size={20} color={colors.foreground} />
    </TouchableOpacity>
  );
}
