/**
 * Spacing design tokens for EduDash Pro
 * Provides consistent spacing scale for layouts
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
} as const;

export type SpacingVariant = keyof typeof Spacing;

/**
 * Helper function to get spacing value
 */
export const spacing = (size: SpacingVariant): number => Spacing[size];
