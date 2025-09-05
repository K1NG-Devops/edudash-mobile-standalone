// Utility for mapping plan tier slugs to human-friendly display names
// Keep this in sync with pricing/plan naming used across the app and backend

export type TierSlug = 'free' | 'starter' | 'premium' | 'enterprise';

const TIER_DISPLAY_NAMES: Record<TierSlug, string> = {
  free: 'Free Tier',
  starter: 'Neural Starter',
  premium: 'Quantum Pro',
  enterprise: 'Enterprise',
};

/**
 * Returns a display name for a given tier slug. Falls back to the provided
 * planName if the slug is unknown, then to "Free" as a final fallback.
 */
export function displayNameForTier(
  tier?: string | null,
  planName?: string | null
): string {
  const key = (tier || '').toLowerCase() as TierSlug;
  if (key && (TIER_DISPLAY_NAMES as Record<string, string>)[key]) {
    return TIER_DISPLAY_NAMES[key];
  }
  if (planName && planName.trim().length > 0) {
    return planName;
  }
  return 'Free';
}

