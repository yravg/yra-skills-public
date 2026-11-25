---
name: captureall-app
description: Capture desktop, Electron and mobile apps - windows, menus, toolbars, panels, dialogs, context menus, shortcuts, states and themes - with computer-use screenshots, accessibility text, dev builds and read-only package inspection. Use when the capture target is an installed app, an app the user is building, or a simulator/emulator, not a website.
---

# Captureall app

## Pick the route

1. **A web or Electron app you can open as a page** (dev server, web version, a renderer URL in a dev build): use `../captureall-web/SKILL.md` on that page. It gives tokens, states, a11y and motion that screenshots cannot.
2. **The user's own app in development** (Xcode, Android Studio, Electron, Tauri): run its dev build from the project, then capture its window with computer use; read layout and strings from the source.
3. **An installed third-party app:** computer-use screenshots and on-screen text only. To read a shipped Electron/ASAR, APK or binary, use `/rea-mode` (read-only, for reference; respect the app's licence).
4. **Open-source app:** read its source for menus, shortcuts and dialogs (as the ArtCraft reference did), and confirm with screenshots.

## Computer-use rules

- Load the computer-use tools in one ToolSearch call; `request_access` for the target app only.
- Browsers are read-only tier and terminals/IDEs click-only: drive web content with the browser tools instead.
- Never click links inside the app; never enter credentials; never change system settings.
- Screenshot, then `zoom` for small text; record coordinates only as a note, not as data.

## Steps

1. List surfaces: main window, every top menu, toolbars and ribbons, side panels, settings pages, dialogs, context menus, onboarding, empty, loading and error states, light and dark.
2. Per surface: screenshot (save as `<app>/<surface>.png`), list visible controls with label, kind, position (area of the window), state, shortcut.
3. Open each menu and record items, separators, submenus and shortcuts.
4. Switch theme (app setting or OS dark mode only with the user's go-ahead) and repeat key surfaces.
5. Resize the window to a narrow and a wide width when the app is responsive.
6. Write `<app>.json` (surfaces, controls, menus, shortcuts, screenshots) and `<app>.md` (readable summary).

## Record shape

```json
{"app":"Name","version":"x.y","captured":"<iso>","platform":"win32",
 "surfaces":[{"name":"Main window","screenshot":"main.png","areas":[{"area":"left toolbar","controls":[{"label":"Brush","kind":"tool","shortcut":"B","state":"selected"}]}]}],
 "menus":[{"name":"File","items":[{"label":"Open…","shortcut":"Ctrl+O"}]}],
 "shortcuts":[{"keys":"Ctrl+Z","action":"Undo","source":"Edit menu"}],
 "themes":["light","dark"],"notReached":[{"surface":"Account","why":"needs sign-in"}]}
```

## QA

Surfaces covered vs listed; every shortcut has a source; screenshots open; nothing typed into the app beyond what navigation needed; access released (no app left in a changed state).
