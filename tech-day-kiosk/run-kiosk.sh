#!/bin/bash
# Launches the Astemes Tech Day loop in Chrome kiosk mode and keeps the Mac awake while it runs.
# Started automatically (and restarted if quit) by the com.astemes.kiosk LaunchAgent.
DIR="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
exec /usr/bin/caffeinate -dims "$CHROME" \
  --kiosk --noerrdialogs --no-first-run --no-default-browser-check \
  --disable-session-crashed-bubble --disable-features=Translate \
  --disable-pinch --overscroll-history-navigation=0 \
  --user-data-dir="$HOME/Library/Application Support/AstemesKiosk" \
  "file://$DIR/index.html"
