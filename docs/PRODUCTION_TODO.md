# Production Readiness To-Do

Security and Policies
- Verify RLS policies for notifications table: allow read by owner; writes only via server functions.
- Confirm RLS for school_invitation_codes allows principals to manage their own school codes only.
- Ensure environment variables and secrets are not logged; guard logs in production.

Notifications
- Add on-focus refresh for header unread count (navigation listeners) if desired.
- Consider a serverless function to create system/admin notifications to bypass client RLS.
- Add pagination/infinite scroll if notification volume grows.

School Invitation Codes
- Add in-app QR generation (e.g., react-native-qrcode-svg) to avoid external endpoint.
- Allow principals to edit description and attach metadata pairs (campaign/channel) when generating.
- Add analytics event when codes are generated, shared, or redeemed.

Logging and Telemetry
- Sweep remaining debug logs; ensure createLogger respects NODE_ENV for verbosity.
- Wire basic analytics (screen views: principal dashboard, code manager, notifications).
- Add error boundary tracking to capture UI exceptions.

Build and Deployment
- Run type-check and lint; fix any warnings.
- Verify web build opens QR modal and deep links correctly.
- Ensure app.json/app.config has deep link scheme edudashpro.
- Test updates flow (OTA) with latest Expo.

Schema and Migrations
- Confirm school_invitation_codes has description (text) and metadata (jsonb, nullable) across environments.
- Backfill existing codes with default description if needed.
- Validate indexes for notifications (user_id, is_read, created_at) and invitation codes (preschool_id, is_active).

QA Checklist
- Notifications: unread badge increments/decrements with list actions.
- RLS denies client inserts; server path can create notifications if needed.
- SchoolCodeManager: generate/deactivate; QR renders; share/copy works; description/metadata visible.
- MobileHeader: badge shows, updates on interval; respects provided prop override.

