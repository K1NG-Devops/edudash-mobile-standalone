/**
 * Simple web implementation that always returns 'light'
 * This prevents server-side rendering issues
 */
export function useColorScheme() {
  return 'light' as const;
}
