#!/usr/bin/env bash
# Dev-only: export selected "preschool-related" tables from PROD to a dump file (custom format)
# Usage:
#   PROD_DB_URL=postgres://user:pass@host:5432/db ./scripts/dev/export_seed.sh [output_base]
# Notes:
# - Read-only against PROD. Does not modify PROD.
# - Default output files: scripts/dev/dev_seed_from_prod.dump and .sql (preview)
# - You can edit the TABLES array below to change scope.
set -euo pipefail

: "${PROD_DB_URL:?Set PROD_DB_URL to your production connection string (psql format).}" 

OUTPUT_BASE="${1:-scripts/dev/dev_seed_from_prod}"
DUMP_FILE="${OUTPUT_BASE}.dump"
SQL_FILE="${OUTPUT_BASE}.sql"
mkdir -p "$(dirname "$OUTPUT_BASE")"

# If PG_FORCE_IPV4_ADDR is set, append hostaddr to the connection string to force IPv4
# If not set, try to auto-resolve an IPv4 for the PROD host.
DB_URL="$PROD_DB_URL"
if [[ -z "${PG_FORCE_IPV4_ADDR:-}" ]]; then
  # Try to parse host from the URL without printing it
  _HOST=$(printf %s "$PROD_DB_URL" | sed -E 's#.*@([^:/]+).*#\1#') || true
  if [[ -z "$_HOST" || "$_HOST" == "$PROD_DB_URL" ]]; then
    _HOST=$(printf %s "$PROD_DB_URL" | sed -E 's#^[^/]*//([^/:]+).*#\1#') || true
  fi
  if [[ -n "$_HOST" ]]; then
    _IP=$(getent ahostsv4 "$_HOST" | awk '{print $1; exit}') || true
    if [[ -n "$_IP" ]]; then
      PG_FORCE_IPV4_ADDR="$_IP"
    fi
  fi
fi
if [[ -n "${PG_FORCE_IPV4_ADDR:-}" ]]; then
  if [[ "$DB_URL" == *"?"* ]]; then
    DB_URL="${DB_URL}&hostaddr=${PG_FORCE_IPV4_ADDR}"
  else
    DB_URL="${DB_URL}?hostaddr=${PG_FORCE_IPV4_ADDR}"
  fi
fi

# Tables to export (dependency-friendly grouping). Adjust as needed.
TABLES=(
  # Core tenant + auth
  auth.users
  public.preschools
  public.subscription_plans
  # Org/users
  public.users
  public.user_preferences
  public.addresses
  public.admin_users
  # School structure
  public.age_groups
  public.classes
  # Lesson/content (tied to preschool)
  public.lesson_categories
  public.lessons
  public.activities
  public.media_uploads
  # Students & parents
  public.students
  public.student_registrations
  public.parent_access_codes
  # Messaging
  public.messages
  public.message_recipients
  public.message_drafts
  # Events & engagement
  public.events
  public.event_updates
  public.event_media
  public.event_participants
  public.event_reactions
  public.event_notifications
  # Groups + targeting
  public.principal_groups
  public.group_members
  public.event_audiences
  public.event_invitations
  public.group_invitations
  public.activity_feed
  # Billing (school-scoped)
  public.subscriptions
  public.billing_invoices
  public.payment_transactions
  public.payments
  # Access / invites
  public.teacher_invitations
  public.school_invitation_codes
  # Video
  public.video_calls
  public.video_call_participants
  # Admin/ops
  public.announcements
  public.notifications
  public.support_tickets
)

# Build -t args
TABLE_ARGS=()
for t in "${TABLES[@]}"; do
  TABLE_ARGS+=( -t "$t" )
done

# Try to parse connection URL into parts to force IPv4 host usage
_parse_ok=0
_user=""; _pass=""; _host=""; _port=""; _db=""
if command -v python3 >/dev/null 2>&1; then
  mapfile -t _parts < <(python3 - <<'PY'
import os, urllib.parse
u = urllib.parse.urlparse(os.environ['PROD_DB_URL'])
print(u.username or '')
print(u.password or '')
print(u.hostname or '')
print(u.port or '')
print((u.path or '').lstrip('/'))
PY
  ) || true
  if [[ ${#_parts[@]} -ge 5 ]]; then
    _user="${_parts[0]}"; _pass="${_parts[1]}"; _host="${_parts[2]}"; _port="${_parts[3]}"; _db="${_parts[4]}"
    [[ -z "$_port" ]] && _port=5432
    if [[ -n "$_user" && -n "$_host" && -n "$_db" ]]; then
      _parse_ok=1
    fi
  fi
fi

# Resolve IPv4 for host if parsed OK
_ip_resolved=""
if [[ "$_parse_ok" == "1" ]]; then
  _ip_resolved=$(getent ahostsv4 "$_host" | awk '{print $1; exit}') || true
  if [[ -z "$_ip_resolved" ]]; then
    _parse_ok=0
  fi
fi

echo "Exporting custom dump to: $DUMP_FILE"
if [[ "$_parse_ok" == "1" ]]; then
  PGPASSWORD="$_pass" pg_dump -h "$_ip_resolved" -p "$_port" -U "$_user" -d "$_db" \
    --no-owner --no-privileges \
    -Fc \
    "${TABLE_ARGS[@]}" \
    -f "$DUMP_FILE"
else
  pg_dump "$DB_URL" \
    --no-owner --no-privileges \
    -Fc \
    "${TABLE_ARGS[@]}" \
    -f "$DUMP_FILE"
fi

echo "Exporting preview SQL to: $SQL_FILE"
if [[ "$_parse_ok" == "1" ]]; then
  PGPASSWORD="$_pass" pg_dump -h "$_ip_resolved" -p "$_port" -U "$_user" -d "$_db" \
    --no-owner --no-privileges \
    --data-only --inserts --column-inserts \
    "${TABLE_ARGS[@]}" \
    > "$SQL_FILE"
else
  pg_dump "$DB_URL" \
    --no-owner --no-privileges \
    --data-only --inserts --column-inserts \
    "${TABLE_ARGS[@]}" \
    > "$SQL_FILE"
fi

echo "Done. Files written:\n  $DUMP_FILE\n  $SQL_FILE"

