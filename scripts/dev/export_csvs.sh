#!/usr/bin/env bash
# Dev-only: Export selected tables to CSV from PROD database (read-only)
# Usage:
#   PROD_DB_URL=postgres://user:pass@host:5432/db ./scripts/dev/export_csvs.sh
# Output:
#   scripts/dev/csv/<schema>.<table>.csv for each table
set -euo pipefail

: "${PROD_DB_URL:?Set PROD_DB_URL to your production connection string (psql format).}"

OUT_DIR="scripts/dev/csv"
mkdir -p "$OUT_DIR"

# Tables to export (schema-qualified)
TABLES=(
  auth.users
  public.subscription_plans
  public.preschools
  public.age_groups
  public.users
  public.user_preferences
  public.addresses
  public.admin_users
  public.classes
  public.lesson_categories
  public.lessons
  public.activities
  public.media_uploads
  public.students
  public.student_registrations
  public.parent_access_codes
  public.messages
  public.message_recipients
  public.message_drafts
  public.events
  public.event_updates
  public.event_media
  public.event_participants
  public.event_reactions
  public.event_notifications
  public.principal_groups
  public.group_members
  public.event_audiences
  public.event_invitations
  public.group_invitations
  public.activity_feed
  public.subscriptions
  public.billing_invoices
  public.payment_transactions
  public.payments
  public.teacher_invitations
  public.school_invitation_codes
  public.video_calls
  public.video_call_participants
  public.announcements
  public.notifications
  public.support_tickets
)

# Parse PROD_DB_URL to parts to force IPv4 with -h
parse_ok=0
user=""; pass=""; host=""; port=""; db=""
if command -v python3 >/dev/null 2>&1; then
  mapfile -t parts < <(python3 - <<'PY'
import os, urllib.parse
u = urllib.parse.urlparse(os.environ['PROD_DB_URL'])
print(u.username or '')
print(u.password or '')
print(u.hostname or '')
print(u.port or '')
print((u.path or '').lstrip('/'))
PY
  ) || true
  if [[ ${#parts[@]} -ge 5 ]]; then
    user="${parts[0]}"; pass="${parts[1]}"; host="${parts[2]}"; port="${parts[3]}"; db="${parts[4]}"
    [[ -z "$port" ]] && port=5432
    if [[ -n "$user" && -n "$host" && -n "$db" ]]; then
      parse_ok=1
    fi
  fi
fi

if [[ "$parse_ok" != "1" ]]; then
  echo "Failed to parse PROD_DB_URL. Please run the export manually or install python3." >&2
  exit 1
fi

# Resolve IPv4 address
ip=$(getent ahostsv4 "$host" | awk '{print $1; exit}') || true
if [[ -z "$ip" ]]; then
  echo "Could not resolve IPv4 for $host" >&2
  exit 1
fi

export PGPASSWORD="$pass"

for t in "${TABLES[@]}"; do
  file="$OUT_DIR/${t}.csv"
  echo "Exporting $t -> $file"
  # Use COPY with CSV header
  psql -h "$ip" -p "$port" -U "$user" -d "$db" -v ON_ERROR_STOP=1 -c \
    "COPY (SELECT * FROM $t) TO STDOUT WITH CSV HEADER" > "$file"
  # Basic sanity check: non-empty file with header
  if [[ ! -s "$file" ]]; then
    echo "Warning: $file is empty."
  fi
done

echo "CSV export complete in $OUT_DIR"
