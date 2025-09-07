// Monitoring bootstrap: Sentry + PostHog
// This file is imported for its side-effects at app startup

import { Platform, InteractionManager } from 'react-native'

let initialized = false
let scheduled = false

function getBool(env?: string) {
  return env === 'true' || env === '1'
}

function runtimeReady() {
  // @ts-ignore
  const eu = (global as any).ErrorUtils
  return !!eu && typeof eu.setGlobalHandler === 'function'
}

export function initMonitoring() {
  if (initialized) return

  if (!runtimeReady()) {
    if (scheduled) return
    scheduled = true
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        scheduled = false
        initMonitoring()
      }, 100)
    })
    return
  }

  initialized = true

  const enableSentry = getBool(process.env.EXPO_PUBLIC_ENABLE_SENTRY)
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN

  const enablePostHog = getBool(process.env.EXPO_PUBLIC_ENABLE_POSTHOG)
  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

  // Sentry
  if (enableSentry && sentryDsn) {
    try {
      // Lazy import to avoid startup cost if disabled
      const Sentry = require('@sentry/react-native')
      Sentry.init({
        dsn: sentryDsn,
        enableInExpoDevelopment: false,
        debug: false,
        tracesSampleRate: 0.15,
        beforeSend(event: any) {
          // Scrub PII
          if (event.user) {
            delete event.user.email
            delete event.user.username
            delete event.user.ip_address
          }
          return event
        },
      })
    } catch {}
  }

  // PostHog
  if (enablePostHog && posthogKey) {
    try {
      // Lazy import
      const PostHog = require('posthog-react-native').default
      PostHog.init(posthogKey, {
        host: posthogHost,
        flushAt: 10,
        enable: true,
        captureApplicationLifecycleEvents: true,
        android: { captureScreenViews: true },
        ios: { captureScreenViews: true },
      })
    } catch {}
  }
}

// Auto-init when this module is imported
initMonitoring()

