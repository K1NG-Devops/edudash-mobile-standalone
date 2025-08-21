# PR Notes: Notifications, School Invitation Codes, and Principal UI polish

Summary of changes
- Fix notifications badge vs. list mismatch by normalizing DB `is_read` -> UI `read` in NotificationService. Added lightweight logger.
- Harden NotificationService for current schema: removed selects/inserts of `related_entity_type` and `related_entity_id` which are not present in your notifications table.
- Notifications screen: dev-only “Add test” button now handles RLS-denied inserts with a friendly message. Mark-one/mark-all read flows unchanged.
- MobileHeader: auto-fetch unread count using NotificationService and poll every 15s; falls back to provided prop if set.
- PrincipalService: include `description` and `metadata` when generating new school invitation codes.
- SchoolCodeManager: wired to PrincipalService, polished UI; displays description and metadata, added QR preview modal for invite link, share/copy helpers.

Rationale
- Ensure consistent unread logic between header and list.
- Avoid schema drift errors across environments.
- Improve principal experience managing school codes and sharing them.

Testing notes
- Verified unread badge updates on interval and after navigation to Notifications.
- Validated fetching notifications does not request non-existent columns.
- In dev, `Add test` shows RLS message if inserts are blocked (expected in prod).
- Generated an invite code; description/metadata display; QR modal renders; share/copy actions.

Follow-ups
- Optional: move QR generation to in-app SVG (react-native-qrcode-svg) to avoid network dependency.
- Optional: add on-focus refresh for header unread count via navigation events.
- Evaluate server endpoint for creating notifications (if client RLS stays strict), and expose minimal function for admin/system events.

