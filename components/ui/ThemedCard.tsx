import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { shadow } from '@/lib/ui/shadow';
import { DesignSystem } from '@/constants/DesignSystem';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat' | 'outlined';
  hoverEffect?: boolean;
}

export default function ThemedCard({ children, style, variant = 'elevated', hoverEffect = true }: CardProps) {
  const { colorScheme } = useTheme();
  const palette = Colors[colorScheme];
  const [hovered, setHovered] = useState(false);

  const baseShadowDepth = variant === 'elevated' ? 4 : 0;
  const hoverShadowDepth = 6;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: palette.surface,
      borderRadius: DesignSystem.borderRadius.lg,
      padding: DesignSystem.spacing.lg,
      borderWidth: variant === 'outlined' ? 1 : 0,
      borderColor: palette.outline,
      ...(hoverEffect && Platform.OS === 'web' && hovered ? shadow(hoverShadowDepth) : shadow(baseShadowDepth)),
      ...(hoverEffect && Platform.OS === 'web' && hovered ? ({ transform: [{ scale: 1.01 }] } as any) : null),
      transitionDuration: Platform.OS === 'web' ? '120ms' : undefined,
      transitionProperty: Platform.OS === 'web' ? 'box-shadow, transform' : undefined,
    },
  }), [palette.surface, palette.outline, variant, hovered, hoverEffect]);

  return (
    <Pressable
      onHoverIn={hoverEffect && Platform.OS === 'web' ? () => setHovered(true) : undefined}
      onHoverOut={hoverEffect && Platform.OS === 'web' ? () => setHovered(false) : undefined}
      style={[styles.card, style]}
      accessibilityRole="summary"
    >
      {children}
    </Pressable>
  );
}

