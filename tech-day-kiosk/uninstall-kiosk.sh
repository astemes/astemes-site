#!/bin/bash
# Usage: sudo bash uninstall-kiosk.sh [kiosk-username] [--delete-user]
set -euo pipefail
KUSER="${1:-techday}"
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo."; exit 1; }
HOMEDIR="$(dscl . -read "/Users/$KUSER" NFSHomeDirectory 2>/dev/null | awk '{print $2}')"
[ -n "$HOMEDIR" ] && rm -f "$HOMEDIR/Library/LaunchAgents/com.astemes.kiosk.plist"
rm -rf /Users/Shared/astemes-kiosk
if [ "${2:-}" = "--delete-user" ]; then sysadminctl -deleteUser "$KUSER"; fi
echo "Kiosk removed."
