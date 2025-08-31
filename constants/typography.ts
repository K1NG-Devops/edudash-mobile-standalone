/**
 * Typography design tokens for EduDash Pro messaging
 * Inspired by WhatsApp's clean, readable text hierarchy
 */

export const Typography = {
  // Header text sizes
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 17,
  },

  // Message text
  messageText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },

  // Conversation list
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  conversationPreview: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
  },
  conversationTime: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },

  // Input
  inputText: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },
  inputPlaceholder: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 20,
  },

  // Badges and labels
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  roleLabel: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },

  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
} as const;

export type TypographyVariant = keyof typeof Typography;
