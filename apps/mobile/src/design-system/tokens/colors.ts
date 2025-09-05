/**
 * Design System Color Tokens
 * Using Radix UI Colors as the base palette
 */

import {
  slate,
  slateDark,
  blue,
  blueDark,
  green,
  greenDark,
  red,
  redDark,
  amber,
  amberDark,
  violet,
  violetDark,
} from '@radix-ui/colors';

// Convert Radix colors to React Native compatible format
const convertRadixColors = (colors: Record<string, string>) => {
  const converted: Record<string, string> = {};
  Object.entries(colors).forEach(([key, value]) => {
    // Remove the color name prefix (e.g., slate1 -> 1)
    const match = key.match(/[a-zA-Z]+(\d+)/);
    if (match) {
      converted[match[1]] = value;
    }
  });
  return converted;
};

// Base color scales
export const slateScale = convertRadixColors(slate);
export const slateDarkScale = convertRadixColors(slateDark);
export const blueScale = convertRadixColors(blue);
export const blueDarkScale = convertRadixColors(blueDark);
export const greenScale = convertRadixColors(green);
export const greenDarkScale = convertRadixColors(greenDark);
export const redScale = convertRadixColors(red);
export const redDarkScale = convertRadixColors(redDark);
export const amberScale = convertRadixColors(amber);
export const amberDarkScale = convertRadixColors(amberDark);
export const violetScale = convertRadixColors(violet);
export const violetDarkScale = convertRadixColors(violetDark);

// Semantic color tokens for light theme
export const lightColors = {
  // Background colors
  background: slateScale['1'],
  backgroundSubtle: slateScale['2'],
  backgroundElement: slateScale['3'],
  backgroundHover: slateScale['4'],
  backgroundActive: slateScale['5'],
  
  // Foreground colors
  foreground: slateScale['12'],
  foregroundSubtle: slateScale['11'],
  foregroundMuted: slateScale['10'],
  foregroundDisabled: slateScale['8'],
  
  // Primary colors (blue)
  primary: blueScale['9'],
  primaryForeground: '#ffffff',
  primarySubtle: blueScale['3'],
  primaryHover: blueScale['10'],
  primaryActive: blueScale['11'],
  
  // Secondary colors (violet)
  secondary: violetScale['9'],
  secondaryForeground: '#ffffff',
  secondarySubtle: violetScale['3'],
  secondaryHover: violetScale['10'],
  secondaryActive: violetScale['11'],
  
  // Success colors (green)
  success: greenScale['9'],
  successForeground: '#ffffff',
  successSubtle: greenScale['3'],
  successHover: greenScale['10'],
  successActive: greenScale['11'],
  
  // Warning colors (amber)
  warning: amberScale['9'],
  warningForeground: slateScale['12'],
  warningSubtle: amberScale['3'],
  warningHover: amberScale['10'],
  warningActive: amberScale['11'],
  
  // Destructive/Error colors (red)
  destructive: redScale['9'],
  destructiveForeground: '#ffffff',
  destructiveSubtle: redScale['3'],
  destructiveHover: redScale['10'],
  destructiveActive: redScale['11'],
  
  // Border and input colors
  border: slateScale['6'],
  borderSubtle: slateScale['5'],
  borderStrong: slateScale['7'],
  input: slateScale['7'],
  inputFocus: blueScale['8'],
  
  // Special colors
  ring: blueScale['8'],
  muted: slateScale['9'],
  mutedForeground: slateScale['11'],
  accent: violetScale['9'],
  accentForeground: '#ffffff',
};

// Semantic color tokens for dark theme
export const darkColors = {
  // Background colors
  background: slateDarkScale['1'],
  backgroundSubtle: slateDarkScale['2'],
  backgroundElement: slateDarkScale['3'],
  backgroundHover: slateDarkScale['4'],
  backgroundActive: slateDarkScale['5'],
  
  // Foreground colors
  foreground: slateDarkScale['12'],
  foregroundSubtle: slateDarkScale['11'],
  foregroundMuted: slateDarkScale['10'],
  foregroundDisabled: slateDarkScale['8'],
  
  // Primary colors (blue)
  primary: blueDarkScale['9'],
  primaryForeground: '#ffffff',
  primarySubtle: blueDarkScale['3'],
  primaryHover: blueDarkScale['10'],
  primaryActive: blueDarkScale['11'],
  
  // Secondary colors (violet)
  secondary: violetDarkScale['9'],
  secondaryForeground: '#ffffff',
  secondarySubtle: violetDarkScale['3'],
  secondaryHover: violetDarkScale['10'],
  secondaryActive: violetDarkScale['11'],
  
  // Success colors (green)
  success: greenDarkScale['9'],
  successForeground: '#ffffff',
  successSubtle: greenDarkScale['3'],
  successHover: greenDarkScale['10'],
  successActive: greenDarkScale['11'],
  
  // Warning colors (amber)
  warning: amberDarkScale['9'],
  warningForeground: slateDarkScale['12'],
  warningSubtle: amberDarkScale['3'],
  warningHover: amberDarkScale['10'],
  warningActive: amberDarkScale['11'],
  
  // Destructive/Error colors (red)
  destructive: redDarkScale['9'],
  destructiveForeground: '#ffffff',
  destructiveSubtle: redDarkScale['3'],
  destructiveHover: redDarkScale['10'],
  destructiveActive: redDarkScale['11'],
  
  // Border and input colors
  border: slateDarkScale['6'],
  borderSubtle: slateDarkScale['5'],
  borderStrong: slateDarkScale['7'],
  input: slateDarkScale['7'],
  inputFocus: blueDarkScale['8'],
  
  // Special colors
  ring: blueDarkScale['8'],
  muted: slateDarkScale['9'],
  mutedForeground: slateDarkScale['11'],
  accent: violetDarkScale['9'],
  accentForeground: '#ffffff',
};

// Export a function to get colors based on theme
export const getColors = (isDark: boolean) => isDark ? darkColors : lightColors;

// Type definitions
export type ColorScheme = 'light' | 'dark';
export type Colors = typeof lightColors;
