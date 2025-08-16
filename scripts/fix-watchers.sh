#!/usr/bin/env bash
set -euo pipefail

echo "Increasing inotify watcher limits (requires sudo)..."

if ! command -v sudo >/dev/null 2>&1; then
  echo "sudo is required to modify sysctl settings. Please run manually:"
  echo "  echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf"
  echo "  echo fs.inotify.max_user_instances=1024 | sudo tee -a /etc/sysctl.conf"
  echo "  sudo sysctl -p"
  exit 1
fi

sudo bash -c 'echo fs.inotify.max_user_watches=524288 >> /etc/sysctl.conf'
sudo bash -c 'echo fs.inotify.max_user_instances=1024 >> /etc/sysctl.conf'
sudo sysctl -p

echo "Done. If Expo/Metro is running, restart it."


