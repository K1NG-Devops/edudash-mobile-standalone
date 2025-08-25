import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Hook to get the proper bottom padding to account for the bottom navigation
 * This ensures content doesn't get hidden behind the bottom tab bar
 */
export function useBottomTabHeight() {
  const insets = useSafeAreaInsets();
  
  // Base tab height + padding + safe area insets
  const TAB_HEIGHT = 60; // Approximate height of tab bar
  const EXTRA_PADDING = 20; // Extra padding for better visual spacing
  
  return Math.max(insets.bottom + TAB_HEIGHT + EXTRA_PADDING, TAB_HEIGHT + EXTRA_PADDING);
}
