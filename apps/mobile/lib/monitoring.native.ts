// Native monitoring: React Native + Expo (Android/iOS)
// This mirrors the previous implementation, separated to avoid bundling RN SDKs on web.

import { Platform, InteractionManager } from 'react-native'
import Constants from 'expo-constants'

let initialized = false
let scheduled = false
let retries = 0
const MAX_RETRIES = 10

function getBool(env?: string) {
  return env === 'true' || env === '1'
}

function runtimeReady() {
  // ErrorUtils is set by RN runtime; Sentry touches it internally
  // Guard to avoid "runtime not ready" crashes
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
        retries += 1
        if (retries <= MAX_RETRIES) initMonitoring()
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

  // Skip native monitoring SDKs in Expo Go (not available there)
  const isExpoGo = (Constants as any)?.appOwnership === 'expo'

  // Sentry (native SDK)
  if (enableSentry && sentryDsn && Platform.OS !== 'web' && !isExpoGo) {
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

  // PostHog (native SDK). Skip on web and Expo Go entirely.
  if (enablePostHog && posthogKey && Platform.OS !== 'web' && !isExpoGo) {
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

