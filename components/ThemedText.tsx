import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';
import { DesignSystem } from '@/constants/DesignSystem';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  // Backwards-compatible + extended scale
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, type === 'link' ? 'link' : 'text');

  // Map legacy types to DesignSystem scale
  const variant =
    type === 'default' ? 'body' :
    type === 'title' ? 'h1' :
    type === 'subtitle' ? 'h3' :
    type === 'defaultSemiBold' ? 'body' :
    (type as 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small');

  // Build style from DS
  const ds = DesignSystem.typography[variant];
  const semiBold = type === 'defaultSemiBold' ? { fontWeight: '600' as const } : null;

  return (
    <Text
      style={[
        { color },
        ds,
        type === 'link' ? styles.link : undefined,
        semiBold,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
});
