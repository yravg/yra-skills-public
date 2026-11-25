### App capture

**Capture a desktop, Electron or mobile app: windows, menus, toolbars, panels, dialogs, shortcuts, states and themes.**

1. Read `../../captureall-app/SKILL.md` and pick the route: built dev build, Electron renderer, or native screenshots.
2. Ask computer-use access for the app (only that app).
3. List the surfaces to cover: main window, each menu, toolbars, side panels, settings, dialogs, context menus, empty and error states, light and dark.
4. For each surface: screenshot, then read text and controls (accessibility tree or zoom), then record name, position, controls, shortcut.
5. Collect the shortcut list from menus and the app's help.
6. Electron or web-based apps: if a renderer can be opened as a page (dev build, devtools URL), use engine.js there for tokens and states; shipped binaries go through `/rea-mode`, read only.
7. Write one JSON and one Markdown file per app (surfaces, controls, shortcuts, screenshots list).
8. Run the `captureall` QA gate.

**Reply:** surfaces covered vs listed, shortcut count, file links, surfaces not reached and why.
