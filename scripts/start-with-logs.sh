#!/usr/bin/env bash
# ARCHIVED/DISABLED: This script is disabled by default to prevent accidental execution in production.
if [ "${ALLOW_DANGEROUS_SCRIPTS:-}" != "true" ]; then
  echo "This script is archived and disabled by default. Set ALLOW_DANGEROUS_SCRIPTS=true to run, and ensure you are NOT on production." >&2
  exit 1
fi
# Start Expo dev server and write output to timestamped log file
# Usage: ./scripts/start-with-logs.sh [extra expo args]
# Examples: ./scripts/start-with-logs.sh --clear --web

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# ISO-like timestamp (local time) e.g. 2025-08-26T13-11-05
TS="$(date +%Y-%m-%dT%H-%M-%S)"
LOG_FILE="$LOG_DIR/expo-dev-$TS.log"
LATEST_LINK="$LOG_DIR/latest.log"

# Record some context at the top of the log
{
  echo "==== EduDash Pro dev session ===="
  echo "Started: $(date -Iseconds)"
  echo "CWD: $PROJECT_ROOT"
  echo "Node: $(node -v 2>/dev/null || echo 'unknown')"
  echo "NPM:  $(npm -v 2>/dev/null || echo 'unknown')"
  echo "Expo: $(npx -y expo --version 2>/dev/null || echo 'unknown')"
  echo "=================================="
} | tee "$LOG_FILE" >/dev/null

# Keep a convenient pointer to the latest log
ln -sf "$(basename "$LOG_FILE")" "$LATEST_LINK" 2>/dev/null || true

# Start dev server; forward all args to expo/npm
# Use npm start to keep alignment with package.json
# shellcheck disable=SC2068
npm start -- $@ 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

echo "\n=== Dev session ended: $(date -Iseconds) (exit $EXIT_CODE) ===" | tee -a "$LOG_FILE"
exit $EXIT_CODE

