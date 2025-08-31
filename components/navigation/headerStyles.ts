import { StyleSheet, Platform } from 'react-native';

export const sharedHeaderStyles = StyleSheet.create({
  // Modern glass morphism overlay
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 0,
  },

  // Header container
  headerContainer: {
    paddingHorizontal: 8,
    paddingVertical: 16,
    minHeight: 85,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  // Left section with title/subtitle
  leftSection: {
    flex: 1,
    paddingRight: 12,
    minWidth: 0, // Allow shrinking on narrow screens
  },

  titleContainer: {
    flex: 1,
    minWidth: 0, // Allow shrinking on narrow screens
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    flexShrink: 1,
  },

  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    opacity: 0.9,
    flexShrink: 1,
  },

  // Right section with actions
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 8,
    justifyContent: 'flex-end',
  },

  // Modern action buttons
  modernActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'android' ? 0.2 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Pill-style buttons for coming soon features
  pillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'android' ? 0.15 : 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

  pillButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 14,
  },

  pillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // Badge styles
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Coming soon specific styles
  comingSoonPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    opacity: 0.8,
  },

  soonBadge: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginLeft: 4,
    minWidth: 26,
    alignItems: 'center',
  },

  soonBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
