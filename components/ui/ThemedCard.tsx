import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export default function ThemedCard({ children, style, variant = 'elevated' }: CardProps) {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];

  const styles = StyleSheet.create({
    card: {
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: palette.outline,
      shadowColor: '#000',
      shadowOpacity: variant === 'elevated' ? 0.2 : 0,
      shadowRadius: variant === 'elevated' ? 8 : 0,
      shadowOffset: { width: 0, height: variant === 'elevated' ? 4 : 0 },
      elevation: variant === 'elevated' ? 4 : 0,
    },
  });

  return <View style={[styles.card, style]}>{children}</View>;
}

