// Utility for mapping plan tier slugs to human-friendly display names
// Keep this in sync with pricing/plan naming used across the app and backend

// Support both legacy slugs (starter/premium) and new slugs (basic/pro)
export type TierSlug = 'free' | 'basic' | 'pro' | 'enterprise' | 'starter' | 'premium';

const TIER_DISPLAY_NAMES: Record<TierSlug, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
  // Legacy slugs map to new display names for backward compatibility
  starter: 'Basic',
  premium: 'Pro',
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

