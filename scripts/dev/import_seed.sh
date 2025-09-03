#!/usr/bin/env bash
# Dev-only: import selected tables dump into DEV database
# Usage:
#   DEV_DB_URL=postgres://user:pass@host:5432/db ./scripts/dev/import_seed.sh [input_dump]
# Notes:
# - Uses pg_restore on a custom-format dump created by export_seed.sh
# - Disables triggers during restore to avoid FK issues, restores in a single transaction
# - If you need a clean slate, consider truncating target tables in DEV before import
set -euo pipefail

: "${DEV_DB_URL:?Set DEV_DB_URL to your dev connection string (psql format).}" 

INPUT_DUMP="${1:-scripts/dev/dev_seed_from_prod.dump}"

if [[ ! -f "$INPUT_DUMP" ]]; then
  echo "Input dump not found: $INPUT_DUMP" >&2
  exit 1
fi

echo "Restoring into DEV from: $INPUT_DUMP"
# Parse DEV_DB_URL into parts and resolve IPv4, then use keyword args to avoid URL parsing issues
_parse_ok=0
_user=""; _pass=""; _host=""; _port=""; _db=""
if command -v python3 >/dev/null 2>&1; then
  mapfile -t _parts < <(python3 - <<'PY'
import os, urllib.parse
u = urllib.parse.urlparse(os.environ['DEV_DB_URL'])
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

if [[ "$_parse_ok" != "1" ]]; then
  # Fallback: try to parse keyword=val conninfo (e.g., host=... user=... password=... dbname=... port=...)
  _kv_host=$(printf %s "$DEV_DB_URL" | sed -n 's/.*host=\([^ ]*\).*/\1/p')
  _kv_user=$(printf %s "$DEV_DB_URL" | sed -n 's/.*user=\([^ ]*\).*/\1/p')
  _kv_pass=$(printf %s "$DEV_DB_URL" | sed -n 's/.*password=\([^ ]*\).*/\1/p')
  _kv_db=$(printf %s "$DEV_DB_URL" | sed -n 's/.*dbname=\([^ ]*\).*/\1/p')
  _kv_port=$(printf %s "$DEV_DB_URL" | sed -n 's/.*port=\([^ ]*\).*/\1/p')
  if [[ -n "$_kv_host" && -n "$_kv_user" && -n "$_kv_db" ]]; then
    _host="$_kv_host"; _user="$_kv_user"; _db="$_kv_db"; _pass="$_kv_pass"; _port="${_kv_port:-6543}"
    _parse_ok=1
  fi
fi

if [[ "$_parse_ok" != "1" ]]; then
  # Final fallback: use PG* environment variables if provided
  if [[ -n "${PGHOST:-}" && -n "${PGUSER:-}" && -n "${PGDATABASE:-}" ]]; then
    _host="$PGHOST"; _user="$PGUSER"; _db="$PGDATABASE"; _pass="${PGPASSWORD:-}"; _port="${PGPORT:-6543}"
    _parse_ok=1
  else
    echo "Failed to parse DEV_DB_URL for pg_restore. Provide postgresql:// URL, keyword conninfo, or set PGHOST/PGUSER/PGDATABASE (and optionally PGPORT/PGPASSWORD)." >&2
    exit 1
  fi
fi

# Sanitize host if it accidentally contains username@host or host:port
if [[ "$_host" == *"@"* ]]; then
  _host="${_host##*@}"
fi
if [[ "$_host" == *":"* ]]; then
  _host="${_host%%:*}"
fi

# IMPORTANT: For Supabase pooler, use the hostname (not the IP) so TLS SNI routes to the correct tenant
PGPASSWORD="$_pass" pg_restore \
  --no-owner --no-privileges \
  --data-only \
  -T public.users \
  -1 \
  -h "$_host" -p "$_port" -U "$_user" -d "$_db" \
  "$INPUT_DUMP"

echo "Import complete."

