#!/bin/bash
# Usage (from YOUR admin account):  sudo bash install-kiosk.sh [kiosk-username]   (default: techday)
# - compiles the small WebKit (Safari engine) kiosk app from kiosk.swift
# - creates a Standard (non-admin) account if it doesn't exist
# - copies everything to /Users/Shared/astemes-kiosk
# - installs a LaunchAgent in the kiosk account: the show starts at login and restarts if it crashes
# Re-run any time to update the presentation (the existing account is kept).
set -euo pipefail
KUSER="${1:-techday}"
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo:  sudo bash install-kiosk.sh [$KUSER]"; exit 1; }
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="/Users/Shared/astemes-kiosk"
APP="$DEST/AstemesKiosk.app"
BUILDER="${SUDO_USER:-root}"

if ! sudo -u "$BUILDER" xcrun --find swiftc >/dev/null 2>&1; then
  echo "Swift compiler not found. Install the Command Line Tools first:  xcode-select --install"; exit 1
fi
TMP="$(sudo -u "$BUILDER" mktemp -d)"
echo "Compiling kiosk app..."
sudo -u "$BUILDER" xcrun swiftc -O "$SRC/kiosk.swift" -o "$TMP/AstemesKiosk"

mkdir -p "$APP/Contents/MacOS"
cp "$TMP/AstemesKiosk" "$APP/Contents/MacOS/AstemesKiosk"
rm -rf "$TMP"
cat > "$APP/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>Astemes Kiosk</string>
  <key>CFBundleIdentifier</key><string>com.astemes.kiosk</string>
  <key>CFBundleExecutable</key><string>AstemesKiosk</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
PLIST
codesign --force --sign - "$APP" >/dev/null 2>&1 || true
cp "$SRC/index.html" "$DEST/"
chmod -R a+rX "$DEST"

if ! id "$KUSER" >/dev/null 2>&1; then
  while true; do
    read -r -s -p "Choose a password for the new standard account '$KUSER': " PW </dev/tty; echo
    read -r -s -p "Repeat the password: " PW2 </dev/tty; echo
    if [ -z "$PW" ]; then echo "The password can't be empty."; continue; fi
    if [ "$PW" != "$PW2" ]; then echo "The passwords don't match, try again."; continue; fi
    break
  done
  sysadminctl -addUser "$KUSER" -fullName "Astemes Tech Day" -password "$PW" 2>&1 | grep -v -- '-----' || true
  unset PW PW2
  if ! id "$KUSER" >/dev/null 2>&1; then
    echo "ERROR: macOS did not create the account '$KUSER' (see the message above, e.g. a password policy)."
    echo "You can create it manually in System Settings > Users & Groups > Add User (type: Standard),"
    echo "then run this script again."
    exit 1
  fi
  createhomedir -c -u "$KUSER" >/dev/null 2>&1 || true
  echo "Created standard account '$KUSER'."
fi
if dseditgroup -o checkmember -m "$KUSER" admin >/dev/null 2>&1; then
  echo "WARNING: '$KUSER' is an administrator. Use a Standard account for the kiosk."
fi

HOMEDIR="$(dscl . -read "/Users/$KUSER" NFSHomeDirectory | awk '{print $2}')"
LA="$HOMEDIR/Library/LaunchAgents"
mkdir -p "$LA"
cat > "$LA/com.astemes.kiosk.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.astemes.kiosk</string>
  <key>ProgramArguments</key><array>
    <string>$APP/Contents/MacOS/AstemesKiosk</string>
    <string>$DEST/index.html</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><dict><key>SuccessfulExit</key><false/></dict>
  <key>ThrottleInterval</key><integer>3</integer>
  <key>LimitLoadToSessionType</key><string>Aqua</string>
</dict></plist>
PLIST
chown "$KUSER" "$HOMEDIR/Library" 2>/dev/null || true
chown -R "$KUSER":staff "$LA"
chmod 644 "$LA/com.astemes.kiosk.plist"

echo
echo "Done. Log in as '$KUSER' and the show starts full screen."
echo "Exit: Ctrl+Option+Cmd+Q, then log out (Cmd+Shift+Q)."
