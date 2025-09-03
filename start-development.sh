#!/usr/bin/env bash
set -euo pipefail

# Simple dev helper for Expo dev client
# 1) Verifies critical env vars
# 2) Starts Metro in dev-client mode

if [ -f "./scripts/verify-env.js" ]; then
  node ./scripts/verify-env.js || true
fi

# Start Metro for dev client
npx expo start --dev-client --clear

