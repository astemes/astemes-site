# Astemes Tech Day loop

`index.html` is a self-contained presentation that loops automatically: 12 slides, about 3 minutes, with live animations from the website. It works offline; without internet it uses system fonts.

`kiosk.swift` is a small Mac app that shows the presentation full screen in WebKit, the engine Safari uses. While it runs:

- the Dock and menu bar are hidden
- Cmd+Tab, Force Quit and Log Out / Restart / Shut Down are blocked
- Cmd shortcuts do nothing
- the Mac does not sleep

**Secret exit: Ctrl + Option + Cmd + Q**

Keys during the show: → / ← step through slides, Space pauses. Auto-play resumes after 30 s.

## Installed setup

The `techday` Standard account starts the show automatically when it logs in. The show restarts if it crashes, and stays closed after the secret exit. The files live in `/Users/Shared/astemes-kiosk`.

To update after changing the presentation, run this from your own account (the `techday` account is kept):

    sudo bash install-kiosk.sh techday

## At the event

1. Log in as `techday` (Fast User Switching works: menu bar → user icon → Tech Day). The show starts by itself.
2. To stop: press Ctrl+Option+Cmd+Q, then log out with Cmd+Shift+Q, or switch back to your own account.

## Optional hardening (in the `techday` account)

- **Keyboard → Keyboard Shortcuts:** turn off Spotlight and Mission Control.
- **Desktop & Dock → Hot Corners:** set all to "–".
- Use a Kensington cable lock.

## Remove

`sudo bash uninstall-kiosk.sh techday` removes the kiosk. Add `--delete-user` to delete the account too.
