import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: ViewStyle;
  disabled?: boolean;
}

export default function ThemedButton({ title, onPress, variant = 'primary', style, disabled }: ButtonProps) {
  const { colorScheme } = useTheme();
  const isDark = colorScheme === 'dark';

  const palette = Colors[colorScheme];

  const styles = StyleSheet.create({
    button: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: variant === 'ghost' ? 1 : 0,
      borderColor: palette.outline,
      opacity: disabled ? 0.6 : 1,
    },
    primary: {
      backgroundColor: palette.primary,
    },
    secondary: {
      backgroundColor: palette.surfaceVariant,
    },
    danger: {
      backgroundColor: palette.error,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    text: {
      color: variant === 'secondary' ? palette.text : '#FFFFFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  const variantStyle =
    variant === 'primary' ? styles.primary :
    variant === 'secondary' ? styles.secondary :
    variant === 'danger' ? styles.danger : styles.ghost;

  return (
    <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.button, variantStyle, style]}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

