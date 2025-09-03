#!/usr/bin/env bash
# Dev-only: Import CSVs into DEV database in a dependency-safe order
# Usage:
#   DEV_DB_URL=postgres://user:pass@host:5432/db ./scripts/dev/import_csvs.sh
# Input:
#   CSVs produced by export_csvs.sh in scripts/dev/csv
set -euo pipefail

: "${DEV_DB_URL:-}"

IN_DIR="scripts/dev/csv"
if [[ ! -d "$IN_DIR" ]]; then
  echo "Input directory not found: $IN_DIR" >&2
  exit 1
fi

# Parse connection info: prefer DEV_DB_URL, fallback to PG* env vars
parse_ok=0
user=""; pass=""; host=""; port=""; db=""
if [[ -n "${DEV_DB_URL:-}" ]] && command -v python3 >/dev/null 2>&1; then
  mapfile -t parts < <(python3 - <<'PY'
import os, urllib.parse
u = urllib.parse.urlparse(os.environ['DEV_DB_URL'])
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
  if [[ -n "${PGHOST:-}" && -n "${PGUSER:-}" && -n "${PGDATABASE:-}" ]]; then
    host="$PGHOST"; user="$PGUSER"; db="$PGDATABASE"; pass="${PGPASSWORD:-}"; port="${PGPORT:-6543}"
    parse_ok=1
  else
    echo "Failed to parse connection info. Set DEV_DB_URL or PGHOST/PGUSER/PGDATABASE (and optionally PGPORT/PGPASSWORD)." >&2
    exit 1
  fi
fi

# Use hostname for pooler/SNI
export PGPASSWORD="$pass"

# Import order to satisfy FKs. Adjust as needed.
ORDER=(
  public.subscription_plans
  public.preschools
  public.age_groups
  auth.users
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

for t in "${ORDER[@]}"; do
  file="$IN_DIR/${t}.csv"
  if [[ -f "$file" ]]; then
    echo "Importing $file -> $t"
    if [[ "$t" == "auth.users" ]]; then
      # Build a column list from CSV header to match COPY order, but only include columns that exist in auth.users
      header=$(head -n 1 "$file")
      # Remove potential BOM
      header=${header#$'\xef\xbb\xbf'}
      IFS=',' read -r -a cols <<< "$header"
      # Fetch actual columns from the target table
      table_cols=$(psql -h "$host" -p "$port" -U "$user" -d "$db" -t -A -v ON_ERROR_STOP=1 -c "select column_name from information_schema.columns where table_schema='auth' and table_name='users';")
      declare -A ok
      while IFS= read -r tc; do
        ok["$tc"]=1
      done <<< "$table_cols"
      col_list=""
      for c in "${cols[@]}"; do
        # Trim CR/LF, quotes, and spaces
        c="${c%\r}"; c="${c%\n}"; c="${c#\"}"; c="${c%\"}"; c="${c## }"; c="${c%% }"
        # Exclude generated columns, like confirmed_at
        if [[ "$c" == "confirmed_at" ]]; then
          continue
        fi
        # Include only if exists in target
        if [[ -n "${ok[$c]:-}" ]]; then
          if [[ -n "$col_list" ]]; then col_list+=", "; fi
          col_list+="\"$c\""
        fi
      done
      psql -h "$host" -p "$port" -U "$user" -d "$db" -v ON_ERROR_STOP=1 -c \
        "COPY auth.users ($col_list) FROM STDIN WITH CSV HEADER" < "$file"
    else
      psql -h "$host" -p "$port" -U "$user" -d "$db" -v ON_ERROR_STOP=1 -c \
        "COPY $t FROM STDIN WITH CSV HEADER" < "$file"
    fi
  else
    echo "Skip (missing): $file"
  fi
done

echo "CSV import complete from $IN_DIR"
