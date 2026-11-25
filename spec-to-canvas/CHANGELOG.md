# Changelog

## Unreleased

## 1.0.0 (2026-11-23)

- Renamed from `canvas-to-app` to `spec-to-canvas` (plugin and skills: `spec-to-canvas`, `spec-to-canvas-html`, `spec-to-canvas-nohtml`). The name `canvas-to-app` now belongs to the new build plugin.
- Phase 6 (Build) and the State gate moved to the `canvas-to-app` plugin. This plugin now ends at a published, linted canvas plus `canvas-states.json`, and hands off to `/canvas-to-app`.
- Memory path unchanged (`~/.claude/canvas-to-app-memory/`, `$CANVAS_TO_APP_MEMORY`), shared with `/canvas-to-app`.
- Removed the plugin's own `marketplace.json`; install from the `yra-skills` marketplace.

## 0.6.0 (2026-11-18)

- Rules 15 to 17: every board state names its Entry click path and its Data source; every control carries `data-does` or `data-later` with a LATER tag; at most 6 states per board; screen IDs (`S..`) and feature IDs (`F...`) on boards, stories, markers and controls, mirrored in the app as `data-screen` / `data-feature`.
- Phase 6 State gate: a state is done only when the app harness passes it (reached by clicking, same text, pixel difference 1 % or less, zero "Not built yet"); URL shortcuts and drawn stand-ins fail; the sample project stays in the app's project list.
- `lint_boards.mjs` checks the new rules and writes a `--manifest` JSON for the app harness (with a board hash, so a changed board re-opens its states). Board template and anatomy section 9 updated.
- Cause: Clausarium canvas port (2026-11-17) copied drawn states instead of building them; `?view=` shortcuts counted as done.
