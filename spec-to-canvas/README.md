# spec-to-canvas

A Claude Code plugin: from a PRD or spec to a buildable design canvas drawn on the real app. Was named `canvas-to-app` up to 0.6.0; that name now belongs to the build plugin (`../canvas-to-app`), which turns any canvas into the app.

## Install

```
claude plugin marketplace add yravg/yra-skills-public
claude plugin install spec-to-canvas@yra-skills-public
```

## Use

Type `/spec-to-canvas` in any session, or paste:

> Read the PRD and the running app at <url>. Build a coverage matrix, then one canvas board per requirement on real app chrome with Before / After and computed status. Keep everything that exists. Render every board before publishing.

To build the canvas into the app, use `/canvas-to-app`.

## Skills

| Skill | Output |
|---|---|
| `/spec-to-canvas:spec-to-canvas` | Full flow: memory, capture, matrix, boards, check, hand off, learn |
| `/spec-to-canvas:spec-to-canvas-nohtml` | One static HTML page, no interaction |
| `/spec-to-canvas:spec-to-canvas-html` | Interactive HTML design canvas (multi-board) |

Each asks first: include the Before design or not. Default is After only.

Every board follows `skills/spec-to-canvas/references/board-anatomy.md`: NEW (yellow) and PARTIAL (amber dashed, with Exists / Missing) markers, navy callout notes on the window ("Drop a .mlq…", "Hover a file-map segment…"), and five aside cards (What it must show, Motion, Stories, Where it lives, States). Since 0.6.0 every board is buildable: a screen ID (`data-screen="S03"`), feature IDs (`F123`) on stories, markers and controls, an Entry click path and a Data source per state (max 6 states), and `data-does` or `data-later` on every control. In the app, a state is done only when the harness passes it: reached by clicking, same text, 1 % or less pixel difference, zero "Not built yet". Start from `references/board-template.dc.html`.

## Scripts

Run each with no arguments to see usage or run its self-check.

| Script | Does |
|---|---|
| `capture.mjs` | Screenshots real screens at 1600x900 |
| `slice_chrome.py` | Cuts a screenshot into top, rail and status strips |
| `prd_status.mjs` | Counts done, partial, missing per board; fails on a row with no board |
| `lint_boards.mjs` | Checks boards against the anatomy: notes, markers, aside cards, Exists/Missing, toggle, IDs, states, controls; `--manifest` writes the app harness checklist |
| `render_boards.mjs` | Renders boards, fails on errors, broken images, overflow |
| `memory.mjs` | Reads and extends the memory (`init`, `show`, `add`, `note`, `self-check`) |

## Memory

The skill reads its memory first (Phase 0) and extends it last (Phase 7), so each run starts better than the one before.

- Lives in `~/.claude/canvas-to-app-memory/` (or `$CANVAS_TO_APP_MEMORY`), outside the plugin, so updates keep it.
- `lessons.md`: general rules with evidence. `projects/<slug>.md`: facts of one app.
- First run copies `memory-seed/` (yraverageMilestone, Solvarium) where a file is missing. It never overwrites.
- Check it: `node skills/spec-to-canvas/scripts/memory.mjs self-check`
