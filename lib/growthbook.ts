import { GrowthBook } from '@growthbook/growthbook'
import { Platform } from 'react-native'

// Create a single GrowthBook instance for the app
const clientKey = process.env.EXPO_PUBLIC_GROWTHBOOK_CLIENT_KEY
const apiHost = process.env.EXPO_PUBLIC_GROWTHBOOK_API_HOST || 'https://cdn.growthbook.io'

// Dynamically load plugins to avoid build-time evaluation issues
const getPlugins = () => {
  try {
    // Only use autoAttributesPlugin on web platform, as it's browser-only
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const { autoAttributesPlugin } = require('@growthbook/growthbook/plugins')
      return [autoAttributesPlugin()]
    }
  } catch (error) {
    console.warn('GrowthBook: Could not load autoAttributesPlugin for web platform:', error)
  }
  return []
}

export const growthbook = new GrowthBook({
  apiHost,
  clientKey,
  enableDevMode: process.env.EXPO_PUBLIC_ENVIRONMENT !== 'production',
  trackingCallback: (experiment, result) => {
    // Send experiment exposure to PostHog (already initialized by lib/monitoring)
    try {
      const PostHog = require('posthog-react-native').default
      if (PostHog?.capture) {
        PostHog.capture('$experiment_started', {
          experiment_id: experiment.key,
          variant_id: result.key,
        })
      }
    } catch {
      // best-effort: do nothing if PostHog isn't ready
    }
  },
  plugins: getPlugins(),
})

// Load features once on startup (SSE streaming is not used on RN)
if (clientKey) {
  growthbook.loadFeatures().catch(() => {})
}

export function setGrowthBookAttributes(attrs: Record<string, any>) {
  try {
    growthbook.setAttributes(attrs)
  } catch {
    // ignore
  }
}

