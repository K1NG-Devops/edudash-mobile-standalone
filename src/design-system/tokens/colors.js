/**
 * Design System Color Tokens (CommonJS for Tailwind config)
 * Using Radix UI Colors as the base palette
 */

// For now, we'll define the colors directly since @radix-ui/colors needs to be imported
// In production, you would extract these from the actual Radix colors

// Semantic color tokens for light theme
const lightColors = {
  // Background colors
  background: '#fcfcfc',
  backgroundSubtle: '#f9f9f9',
  backgroundElement: '#f0f0f0',
  backgroundHover: '#e8e8e8',
  backgroundActive: '#e0e0e0',
  
  // Foreground colors
  foreground: '#1c1c1c',
  foregroundSubtle: '#646464',
  foregroundMuted: '#8b8b8b',
  foregroundDisabled: '#a6a6a6',
  
  // Primary colors (blue)
  primary: '#0066cc',
  primaryForeground: '#ffffff',
  primarySubtle: '#e0edff',
  primaryHover: '#0055aa',
  primaryActive: '#004488',
  
  // Secondary colors (violet)
  secondary: '#7c3aed',
  secondaryForeground: '#ffffff',
  secondarySubtle: '#ede9fe',
  secondaryHover: '#6d28d9',
  secondaryActive: '#5b21b6',
  
  // Success colors (green)
  success: '#10b981',
  successForeground: '#ffffff',
  successSubtle: '#d1fae5',
  successHover: '#059669',
  successActive: '#047857',
  
  // Warning colors (amber)
  warning: '#f59e0b',
  warningForeground: '#1c1c1c',
  warningSubtle: '#fef3c7',
  warningHover: '#d97706',
  warningActive: '#b45309',
  
  // Destructive/Error colors (red)
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  destructiveSubtle: '#fee2e2',
  destructiveHover: '#dc2626',
  destructiveActive: '#b91c1c',
  
  // Border and input colors
  border: '#d4d4d4',
  borderSubtle: '#e0e0e0',
  borderStrong: '#c0c0c0',
  input: '#d4d4d4',
  inputFocus: '#3b82f6',
  
  // Special colors
  ring: '#3b82f6',
  muted: '#8b8b8b',
  mutedForeground: '#646464',
  accent: '#7c3aed',
  accentForeground: '#ffffff',
};

// Semantic color tokens for dark theme
const darkColors = {
  // Background colors
  background: '#111111',
  backgroundSubtle: '#1a1a1a',
  backgroundElement: '#232323',
  backgroundHover: '#2e2e2e',
  backgroundActive: '#3a3a3a',
  
  // Foreground colors
  foreground: '#ededed',
  foregroundSubtle: '#b4b4b4',
  foregroundMuted: '#8b8b8b',
  foregroundDisabled: '#6b6b6b',
  
  // Primary colors (blue)
  primary: '#3b82f6',
  primaryForeground: '#ffffff',
  primarySubtle: '#1e3a5f',
  primaryHover: '#2563eb',
  primaryActive: '#1d4ed8',
  
  // Secondary colors (violet)
  secondary: '#8b5cf6',
  secondaryForeground: '#ffffff',
  secondarySubtle: '#2e1f4d',
  secondaryHover: '#7c3aed',
  secondaryActive: '#6d28d9',
  
  // Success colors (green)
  success: '#10b981',
  successForeground: '#ffffff',
  successSubtle: '#064e3b',
  successHover: '#059669',
  successActive: '#047857',
  
  // Warning colors (amber)
  warning: '#f59e0b',
  warningForeground: '#1c1c1c',
  warningSubtle: '#451a03',
  warningHover: '#d97706',
  warningActive: '#b45309',
  
  // Destructive/Error colors (red)
  destructive: '#ef4444',
  destructiveForeground: '#ffffff',
  destructiveSubtle: '#450a0a',
  destructiveHover: '#dc2626',
  destructiveActive: '#b91c1c',
  
  // Border and input colors
  border: '#3a3a3a',
  borderSubtle: '#2e2e2e',
  borderStrong: '#4a4a4a',
  input: '#3a3a3a',
  inputFocus: '#3b82f6',
  
  // Special colors
  ring: '#3b82f6',
  muted: '#6b6b6b',
  mutedForeground: '#b4b4b4',
  accent: '#8b5cf6',
  accentForeground: '#ffffff',
};

module.exports = {
  lightColors,
  darkColors,
};
