---
name: spec-to-canvas-nohtml
description: Draw a product's screens as ONE static HTML page, no interaction, no canvas runtime, AND publish the same boards to a Claude Design canvas (always, rule 13 of spec-to-canvas). Same board standard as spec-to-canvas (NEW and PARTIAL markers with where, callout notes, stories, where it lives). Use when the user wants a single HTML file to read, share or print, next to the commentable Design canvas.
---

# Spec to canvas: single static HTML

Read `../spec-to-canvas/SKILL.md` Phase 0 (memory) and rules 1 to 14 (13: Claude Design home, 14: tastestack design pass) first. This skill changes the output only.

## Ask first

Rule 13 of `../spec-to-canvas/SKILL.md`: the boards always go to a Claude Design canvas too (its "Publishing to Claude Design" steps). Choosing this skill already answers the offline question (Also offline HTML), so do not ask it again; the questions below still apply.

Use AskUserQuestion before any work, one call with up to two questions:

1. "Include the Before design next to the After design?"
- **After only (default)**: one frame per screen. Use this if there is no answer.
- **Before and After**: two frames per screen, Before on the left, After on the right, stacked in the same section. No toggle, no script.

2. Only when the canvas ports or matches another product (reference app, competitor, training video, brochure): "Add snapshots of the reference UI at the bottom of each board?"
- **Yes**: a "Reference: the original UI" strip under each board with cropped frames and one-line captions (`../spec-to-canvas/references/board-anatomy.md` section 8).
- **No (default)**: boards only. Use this if there is no answer or no reference product.

## Output

- ONE file: `<slug>.html`. No JS, no external script. Fonts via one Google Fonts link at most. Images inline as files beside it or `data:` URIs under 16 MB total.
- Page width 1640. Cover first (4 stat tiles, tier cards, legend of the real markers), then a status table (one row per board: status, where it lives, link), then one section per board, then the story index.
- Each board section uses the anatomy in `../spec-to-canvas/references/board-anatomy.md`: header (Extends, Lives in), window with `.new` / `.part` markers and `.note` callouts, aside with the five cards. Take CSS from `../spec-to-canvas/references/board-template.dc.html`; drop the `<x-dc>`, `DCLogic` script and the `.vw` toggle.
- Static means notes carry behaviour: every gesture, hover and key is a callout note, because nothing can be clicked.
- Rules 15 to 17 still apply (`board-anatomy.md` section 9): `data-screen` per board section, feature IDs in Stories, a States card with Entry and Data per state, `data-does` / `data-later` on every drawn control. Lint the `.dc.html` export per board, not only this single file (the lint reads one screen ID per file).
- Add a sticky left table of contents with anchor links (plain `<a href="#F14">`), no script.

## Check

1. `node ../spec-to-canvas/scripts/lint_boards.mjs <file> --after-only` (or without the flag for Before and After). The lint reads class names, so keep the template's. shortcut: it expects the `.vw` toggle when Before and After is chosen; a stacked static layout needs `--after-only`, upgrade the lint if that becomes common.
2. Open the file, look at every section at 1640 and 1024 wide. No horizontal overflow.
3. Register the finished HTML per the user's global rule (OS ring copy + json).
4. Export the same boards from the same generator to `.dc.html` and publish them to the Claude Design canvas (main skill, "Publishing to Claude Design").

Then Phase 7 of the main skill (learn). End with the Claude Design canvas link, then the file link.
