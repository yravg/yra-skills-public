---
name: spec-to-canvas-html
description: Draw a product's screens as an INTERACTIVE HTML design canvas (many boards on a canvas, Before/After toggle when wanted, working click handlers, notes). Same board standard as spec-to-canvas. Use when the user wants a Claude Design canvas or an interactive HTML canvas they can click through and comment on.
---

# Spec to canvas: interactive HTML design canvas

Read `../spec-to-canvas/SKILL.md` Phase 0 to Phase 5 and rules 1 to 14 (13: Claude Design home, 14: tastestack design pass). This skill is the full canvas flow with one fixed output: an interactive design canvas.

## Ask first

Use AskUserQuestion before any work, one call with up to three questions (the third is rule 13's offline question: Claude Design only by default, or also an offline HTML copy from the same generator):

1. "Include the Before design next to the After design?"
- **After only (default)**: no Before capture, no toggle. Use this if there is no answer.
- **Before and After**: `Before | After` toggle on every board with a real click handler. Before is a real screenshot.

2. Only when the canvas ports or matches another product (reference app, competitor, training video, brochure): "Add snapshots of the reference UI at the bottom of each board?"
- **Yes**: a "Reference: the original UI" strip under each board with cropped frames and one-line captions (`../spec-to-canvas/references/board-anatomy.md` section 8).
- **No (default)**: boards only. Use this if there is no answer or no reference product.

## Output

- Claude Design canvas layout from main skill Phase 4 ("Claude Design canvas layout"): `project/canvas.json` v3, `Main.dc.html` cover, `Index.dc.html`, one `<ID>-<slug>.dc.html` per board, tier notes as `title1`.
- Every board starts from `../spec-to-canvas/references/board-template.dc.html` and meets `../spec-to-canvas/references/board-anatomy.md`. Interactivity beyond the toggle is allowed when it shows the feature (tabs, hover highlight, a second state); set `is_interactive: true` on that board in `canvas.json`. Keep each callout note, because a click path is not documentation.
- States per feature: normal, empty, error, locked, plus `Needs input` where the feature asks for something, but only states with a real click path in the app (rules 15 to 17, `board-anatomy.md` section 9). Each state switch button carries `data-state`, each state has a States row with Entry and Data, each control has `data-does` + `data-feature` or `data-later` + LATER tag, the board root has `data-screen`. More than 6 states: split the board.
- One synthetic sample project across all boards.

## Check

1. `node ../spec-to-canvas/scripts/lint_boards.mjs <project dir> [--after-only] --manifest <app>/canvas-states.json` (the manifest is the app harness checklist, rule 16)
2. `node ../spec-to-canvas/scripts/render_boards.mjs` on every board; click Before on at least one board when it exists.
3. Publish one board per call; send `canvas.json` only when layout or order changes.

Publish per the main skill's "Publishing to Claude Design" steps. Then Phase 6 (hand off to `/canvas-to-app` to build) when asked, and Phase 7 (learn). End with the Claude Design canvas link (and the offline file link when chosen).
