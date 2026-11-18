// Astemes Tech Day kiosk — shows the presentation full screen in WebKit (the Safari engine)
// and locks the session down while it runs:
//   - Dock and menu bar hidden, Apple menu disabled
//   - Cmd+Tab, Force Quit (Cmd+Opt+Esc), Log Out / Restart / Shut Down disabled
//   - display and system sleep prevented
//   - all Cmd shortcuts swallowed (Cmd+Q, Cmd+W, Cmd+R ... do nothing)
// Secret exit:  Ctrl + Option + Cmd + Q
//
// Build:  swiftc -O kiosk.swift -o AstemesKiosk
// Run:    ./AstemesKiosk /path/to/index.html

import Cocoa
import WebKit

final class KioskWindow: NSWindow {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { true }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    let url: URL
    var window: KioskWindow!
    var web: WKWebView!
    var activity: NSObjectProtocol?
    var keyMonitor: Any?

    init(url: URL) { self.url = url }

    func screenFrame() -> NSRect {
        return (NSScreen.main ?? NSScreen.screens[0]).frame
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let frame = screenFrame()
        window = KioskWindow(contentRect: frame, styleMask: [.borderless], backing: .buffered, defer: false)
        window.backgroundColor = NSColor(calibratedRed: 0x21 / 255.0, green: 0x21 / 255.0, blue: 0x21 / 255.0, alpha: 1)
        window.isReleasedWhenClosed = false

        let config = WKWebViewConfiguration()
        web = WKWebView(frame: NSRect(origin: .zero, size: frame.size), configuration: config)
        web.navigationDelegate = self
        web.allowsBackForwardNavigationGestures = false
        web.allowsMagnification = false
        web.autoresizingMask = [.width, .height]
        window.contentView = web
        window.setFrame(frame, display: true)

        NSApp.activate(ignoringOtherApps: true)
        window.makeKeyAndOrderFront(nil)
        NSApp.presentationOptions = [.hideDock, .hideMenuBar, .disableAppleMenu,
                                     .disableProcessSwitching, .disableForceQuit,
                                     .disableSessionTermination, .disableHideApplication]
        NSCursor.hide()

        web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())

        activity = ProcessInfo.processInfo.beginActivity(
            options: [.idleDisplaySleepDisabled, .idleSystemSleepDisabled, .userInitiated],
            reason: "Astemes tech day presentation")

        keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            let flags = event.modifierFlags.intersection(.deviceIndependentFlagsMask)
            let key = (event.charactersIgnoringModifiers ?? "").lowercased()
            if flags.contains([.control, .option, .command]) && key == "q" {
                NSApp.presentationOptions = []
                NSApp.terminate(nil)
                return nil
            }
            if flags.contains(.command) { return nil }   // swallow every other Cmd shortcut
            return event
        }

        let nc = NotificationCenter.default
        nc.addObserver(forName: NSApplication.didResignActiveNotification, object: nil, queue: .main) { _ in
            NSApp.activate(ignoringOtherApps: true)        // take focus back if anything steals it
        }
        nc.addObserver(forName: NSApplication.didChangeScreenParametersNotification, object: nil, queue: .main) { [weak self] _ in
            guard let self = self else { return }
            self.window.setFrame(self.screenFrame(), display: true)
        }
    }

    // If the web content process ever crashes, just reload the show.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { false }
}

let args = CommandLine.arguments
let path = args.count > 1 ? args[1] : "/Users/Shared/astemes-kiosk/index.html"
let app = NSApplication.shared
app.setActivationPolicy(.regular)
let delegate = AppDelegate(url: URL(fileURLWithPath: path))
app.delegate = delegate
app.run()
