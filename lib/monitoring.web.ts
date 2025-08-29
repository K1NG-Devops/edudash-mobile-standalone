// Web monitoring: safe for Expo web bundler
// Initialize Sentry for web only when enabled via env. PostHog is skipped on web by default.

function getBool(env?: string) {
  return env === 'true' || env === '1'
}

export function initMonitoring() {
  const enableSentry = getBool(process.env.EXPO_PUBLIC_ENABLE_SENTRY)
  const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN

  if (enableSentry && sentryDsn) {
    try {
      // Use Sentry's web SDK on web targets
      const Sentry = require('@sentry/react')
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.15,
        debug: false,
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
      // Swallow — monitoring must never break the app
    }
  }
}

// Auto-init for side effects when imported
initMonitoring()

