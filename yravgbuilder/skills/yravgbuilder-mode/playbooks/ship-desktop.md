### Ship desktop

**Ship the same web build as Windows and macOS apps.**

1. Read `../../yravgbuilder-rust-ship/SKILL.md` (Tauri, sidecar, updater).
2. Confirm the web build runs offline: vendored fonts and scripts, no CDN, export/import for local data.
3. Build the Tauri 2 shell around the web build. Add the Node sidecar only if the app has a server.
4. Build installers (NSIS/MSI on Windows, dmg on a Mac or a CI runner). Run a silent install and a smoke test.
5. Use a signed update feed only when both the feed and the public key are set. Keys stay outside the repo.
6. Stop for the owner before any release, signing identity or publish.

**Reply:** installers built with sizes, smoke test result, update feed state, what needs a Mac or a key, what was not tested.
