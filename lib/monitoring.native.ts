// Native monitoring: React Native + Expo (Android/iOS)
// This mirrors the previous implementation, separated to avoid bundling RN SDKs on web.

import { Platform } from 'react-native'

let initialized = false

function getBool(env?: string) {
  return env === 'true' || env === '1'
}

export function initMonitoring() {
  if (initialized) return
  initialized = true

  const enableSentry = getBool(process.env.EXPO_PUBLIC_ENABLE_SENTRY)
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN

  const enablePostHog = getBool(process.env.EXPO_PUBLIC_ENABLE_POSTHOG)
  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  // Sentry (native SDK)
  if (enableSentry && sentryDsn && Platform.OS !== 'web') {
    try {
      const Sentry = require('@sentry/react-native')
      Sentry.init({
        dsn: sentryDsn,
        enableInExpoDevelopment: false,
        debug: false,
        tracesSampleRate: 0.15,
        beforeSend(event: any) {
          if (event.user) {
            delete event.user.email
            delete event.user.username
            delete event.user.ip_address
          }
          return event
        },
      })
    } catch (err) {
      // Non-fatal; never block app startup
    }
  }

  // PostHog (native SDK). We skip on web entirely.
  if (enablePostHog && posthogKey && Platform.OS !== 'web') {
    try {
      const PostHog = require('posthog-react-native').default
      PostHog.init(posthogKey, {
        host: posthogHost,
        flushAt: 10,
        enable: true,
        captureApplicationLifecycleEvents: true,
        android: { captureScreenViews: true },
        ios: { captureScreenViews: true },
      })
    } catch (err) {
      // ignore
    }
  }
}

// Auto-init when this module is imported
initMonitoring()

