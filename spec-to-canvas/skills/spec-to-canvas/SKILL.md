---
name: spec-to-canvas
description: Take a product from a PRD or spec to a buildable design canvas drawn on the real app (coverage matrix, one board per capability, NEW / PARTIAL markers, states with Entry and Data, screen and feature IDs, a canvas-states.json manifest). Has a memory of lessons from earlier runs that it reads first and extends last. Use when the user asks for a mockup or design canvas of a feature set, for a coverage matrix, for a Before / After comparison with the running app, for what is built against a design, or for a rebrand of existing boards. Building the canvas into the app is /canvas-to-app. Works on any web app.
---

# Spec to canvas

Seventeen rules make this work. Each one exists because skipping it produced bad output.

This skill ends at a published, linted, buildable canvas and its `canvas-states.json` manifest. Building it into the app is the sibling plugin `/canvas-to-app` (rules 12 and 16 are its acceptance; they stay here so the boards are drawn to meet them).

1. **Real chrome, never a redrawn one.** Everything outside the page body is a screenshot of the running app.
2. **Every requirement has a board.** A board for each row, not only the built ones. Unbuilt rows are drawn and labelled, never skipped.
3. **Tokens from code.** Colours, fonts, radii and sizes come from the app's CSS, read by a script or copied exactly.
4. **Real components.** Use the design system's own source. A look-alike is a defect.
5. **Add, never replace.** Existing boards, screens and controls stay. No control is removed for a look. New work goes beside them; a screen the app lacks gets a "new" mark.
6. **Status is computed.** Built, partial and missing come from the requirement table, not from memory, and every claim says how it was checked.
7. **Memory first, memory last.** Read the lessons before work (Phase 0). Write what you learned after (Phase 7). A run that learned nothing says so.
8. **Check with real input.** A check that calls the app's API misses what a person hits. Drive the real UI.
9. **Dead controls are defects.** Never build a store or button that nothing reads. Mark it open with the reason.
10. **Honest status.** `done`, `done, part blocked`, `done, part open`, `open`, `blocked`. Never round "partly" up.
11. **Mark every difference, say where.** Each element is plain (built), NEW (yellow), or PARTIAL (amber dashed). A PARTIAL says where the existing part lives and what is missing. Behaviour a still cannot show goes in a callout note ("Drop a .mlq…", "Hover a file-map segment…"). Standard: `references/board-anatomy.md`.
12. **Build the same as drawn.** During development the screen equals the board: same labels, order, states, sample data. Each NEW tag is a build item, each PARTIAL a gap list, each note an acceptance test.
13. **Claude Design is the home of every canvas.** Owner rule (2026-11-08): every canvas, from any of the three skills, is published as a Claude Design canvas (a Design-type artifact), so the owner can comment on boards and Claude edits them in place. An offline HTML copy is optional and asked for (see Ask first). Never deliver a canvas as a local file only.
14. **Design quality goes through tastestack.** Owner rule (2026-11-08): the redrawn body of every board is designed and checked with the tastestack skills, not by eye. See "Design pass" in Phase 4 and the gate in Phase 5. A board that passes the anatomy lint but reads as generic is not done.
15. **Every state is buildable.** Owner rule (2026-11-18). Toggles are the right way to show states; a state with no tie to the app is not. Each state on a board names (a) its **Entry**: the real click path in the app ("Today's page: click a COP row in the register"); no click path, the state is cut; (b) its **Data**: the sample file and record it shows (`meridian-register.js → COP-014`), and the board and the app read that same file, so numbers cannot drift. Each control carries one line on what it does (`data-does`), or a LATER tag (`data-later` + `.latertag`) when it is shown only as future, so nobody builds a fake. At most 6 states per board; a board that needs more is split into smaller boards (register, COP page, remaining), one buildable screen each. Standard: `references/board-anatomy.md` section 9; the lint enforces it.
16. **A state is done only when the app harness passes for it.** Owner rule (2026-11-18). Per board state: reached by clicking its Entry path from the app's start (a `?view=`, `?raw=`, `?state=` or hash shortcut never counts); the same text in every panel as the board; 1 % or less pixel difference against the board render; zero "Not built yet" controls (LATER controls excepted). A drawn (generated) state is allowed only as a temporary stand-in and shows as failing in the harness. The sample project the boards use stays in the app's project list, so the owner can compare app and board side by side. Enforced by `/canvas-to-app` ("State gate").
17. **Every screen and every feature has an ID, in the board and in the app.** Owner rule (2026-11-18, Solvarium style). Screen IDs `S01`, `S02`… (one per board = one buildable screen); feature IDs `F101`, `F123`… (one per PRD row, never reused, never renumbered). The board root carries `data-screen="S03"`; each story, NEW / PARTIAL marker and `data-does` control carries `data-feature="F123"` that is listed in the board's Stories. The built app carries the same `data-screen` on the screen root and `data-feature` on the controls, so the harness, commits, the handoff and the tracker all point at the same thing. A feature with no screen, or a screen with no feature, fails the matrix (Phase 3).

## Memory

Memory lives outside the plugin, so a plugin update keeps it: `$CANVAS_TO_APP_MEMORY`, default `~/.claude/canvas-to-app-memory/`. The path keeps its old name on purpose: `/canvas-to-app` (the build skill) reads and writes the same memory, so drawing and building learn from each other.

- `lessons.md`: rules learned from real runs, each with its evidence. Themed sections, then an Inbox.
- `projects/<slug>.md`: one file per app: repo, handoffs, owner rules, known traps, how the run went.
- `memory-seed/` in the plugin holds the first copy (yraverageMilestone, Solvarium). `scripts/memory.mjs init` copies it in only where a file is missing; it never overwrites.

Commands (from `scripts/`): `node memory.mjs show [project]`, `add --lesson "..." --evidence "..." [--project x]`, `note --project x --text "..."`, `self-check`.

## Phase 0: Recall

1. Run `node scripts/memory.mjs show <project-slug>`. If the app is new, run it without a slug.
2. Apply the lessons that touch this run. Where one conflicts with the user's words, the user wins; note the conflict in Phase 7.
3. Read the app's own handoff and roadmap if they exist (`docs/handoff/<slug>.md`, `docs/roadmap/<slug>.md`). Memory is general; the handoff is the live state.

## Ask first: Before and After?

Before capturing or drawing anything, ask once with AskUserQuestion:

> Include the Before design (today's app) next to the After design?
> - **After only (default)**: boards show the new design. No Before capture, no toggle. Pick this if the user does not answer.
> - **Before and After**: each board gets a Before | After toggle. Before is a real screenshot.

When the canvas ports, matches or answers another product (a competitor, a reference app, a training video, a brochure), ask a second question in the same AskUserQuestion call:

> Add snapshots of the reference UI at the bottom of each board?
> - **Yes (recommended when a reference exists)**: every board gets a "Reference: the original UI" strip under the window and aside: 1 to 6 cropped frames or screenshots of the reference screen that board matches, each with a one-line caption. See `references/board-anatomy.md` section 8.
> - **No**: boards only. Pick this if the user does not answer or there is no reference product.

Always ask a third question in the same AskUserQuestion call (rule 13):

> Claude Design canvas is always made. Also keep an offline HTML copy?
> - **Claude Design only (default)**: boards live in the Design canvas; no local HTML. Pick this if the user does not answer.
> - **Also offline HTML**: the same boards as one static file (`spec-to-canvas-nohtml` output), built from the SAME generator so both stay identical, and registered per the user's global rule.

Record all answers in the status board and the project memory. If After only: skip Phase 2 captures that exist only for Before (keep the chrome slices), and run the lint with `--after-only`.

## Inputs

Find these before anything else. Ask only for what cannot be found.

- Requirement list with stable IDs and a status column (`scripts/prd_status.mjs` reads it)
- Running app URL and how the repo's own UI tests reach it past sign-in
- Reference material: videos, screenshots, competitor pages
- Design system: token file, component source, any `DESIGN.md`
- Existing canvas, if any: read it first and keep it
- Owner rules said earlier on a canvas or in comments: they apply to every board

Never type a production password. Use the app's local mode or the repo's test stub.

## Phase 1: Understand

1. Read the requirement list end to end.
2. For a video, read every distinct frame, not a sample:
   `ffmpeg -v error -y -i in.mp4 -vf "fps=4,mpdecimate=hi=64*40:lo=64*12:frac=0.2" -vsync vfr out_%03d.jpg`
3. Write down exact states and wording. Mark anything you invent as "ours" on the board.
4. Remove other companies' names and any client or person name from everything you publish.
5. For an app with many pages, triage first: score = need + value - half the rebuild risk. Verdict per page: redesign, light pass, leave. Build in score order.

## Phase 2: Capture the real app

1. Run `scripts/capture.mjs` for every top-level tab or group and every screen a board maps to, at 1600x900, scale factor 1. It stores screenshots and page text.
2. Confirm which branch serves the URL. A dev port can serve a feature branch. Write the branch on the status board.
3. Run `scripts/slice_chrome.py` to cut top, rail and status strips. Measure the crop lines from the DOM.
4. Dump the app's real commands from the DOM, so no control is dropped or renamed.

## Phase 3: Matrix

Build a table before drawing: feature ID (`F…`), requirement family, screen ID (`S…`), board, real screen, sample data file. Every feature must land on a screen or be marked out of scope with the reason; every screen must hold at least one feature (rule 17). Assign IDs here, once; later runs only append. Check it with `scripts/prd_status.mjs`.

## Phase 4: Boards

One board per capability. Start from `references/board-template.dc.html` and meet every item in `references/board-anatomy.md` (header with Extends and Lives in; markers NEW / PARTIAL with Exists and Missing; callout notes on the window; five aside cards: What it must show, Motion, Stories, Where it lives, States; screen and feature IDs). Each board has:

- A header outside the app frame: id, title, Extends, Lives in, open gaps
- **Before / After** buttons with a real click handler, only if the user chose Before and After. Before is the real screenshot.
- Real chrome around a redrawn body, in the app's own tokens
- NEW and PARTIAL markers on the elements, and at least two callout notes (trigger in bold, then result)
- Real states: empty, loading, error, approval, not only the happy path. Each state gets a row in the States card with its Entry click path and its Data source (rule 15); a state with no real click path is cut, not drawn. More than 6 states: split the board.
- Every control in the window has `data-does="<one line>"`, or `data-later="<what it will do>"` plus a LATER tag (rule 15)
- One synthetic sample project across all boards, realistic labels, never lorem ipsum. Its data lives in sample files the app will also load (e.g. `src/sample/meridian-register.js`); the generator imports those files instead of typing values into the board, so board and app cannot drift
- Evidence as text beside every picture (spec, source files, test ids that must stay). A reviewer that is a model reads the text, not the image.

A status board comes first: totals, one row per board, links, what is still missing.

On a Claude Design canvas, keep originals on their own page and add a new page. Send only new or changed files. Upload images as assets and use the returned `/_blob/` URL verbatim.

### Claude Design canvas layout

Read from a finished 64-board canvas (yraverageMilestone feature windows). Copy it.

- Files: `project/canvas.json` (v3 index) plus one `project/<ID>-<slug>.dc.html` per board. Ids by family: `U` workspace, `F` feature, `R` ribbon tab, `H` home. `Main.dc.html` is the cover, `Index.dc.html` lists every story and its board.
- `canvas.json`: `title`, `launch.view = "canvas"`, `pages`, `boards{file:{x,y,w,h,title}}`, `order[]`, `notes{id:{x,y,text,kind:"title1",maxW}}` for tier headings, `designSystems`.
- Grid: 4 boards per row, x step 1720 for width 1640. Row y = previous y + board h + 120. A tier note sits 300 px above its first row. Set `h` from the render check, not by guess.
- Board file: `<x-dc>` with a `<helmet>` (font link, `:root` tokens, styles), one root div of fixed width 1640, then `<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1640,"height":H}}'>` holding `class Component extends DCLogic { renderVals(){ return {}; } }`. Before / After buttons go through this class.
- Cover board: title, four stat tiles (boards, stories, built, new), one card per tier, "How to read a board" legend (yellow outline = NEW, navy note = motion, Built / Partial / New pills), story sources.
- Publish one board file per call. Send `canvas.json` only when layout or order changes.

### Publishing to Claude Design (rule 13)

1. `Artifact` `action: quickstart`, `intent: design` (`design_systems: false` unless the app has a Design System artifact). Then publish with the returned `type_url`, a `title`, no files, `auto_open: "after_first_write"`. Keep the returned `url`; every later call uses it, never `type_url` again.
2. Upload every image the boards use as assets in one call (`asset: true`, `file_paths`, up to 25 per call). Save the path -> `/_blob/<id>` map as `blobs.json` beside the generator, so a rebuild reuses the same ids.
3. Keep ONE source of truth: a generator (e.g. `build.mjs`) that writes the boards. It emits the `.dc.html` files under `<root>/project/` with `/_blob/` urls, board links as `<a href="<ID>.dc.html">`, heights from the render check (`heights.json`), and `canvas.json`. When offline HTML was chosen, the same generator writes the static file too.
4. Publish `canvas.json` + `Main.dc.html` first (`root`, `file_path`, `files`), then the rest. Later changes: rebuild, publish only the changed boards.
5. Comments: the owner comments on boards in the canvas; read them with `ArtifactComments` when asked. Fix in the generator, re-publish the changed boards. A publish refused because the owner edited a board: read their version, merge into the generator, publish again.
6. Write the canvas `url` into the app's handoff and project memory. It is private until the owner shares it; say so.

### Design pass (rule 14, tastestack)

Find the plugin root once: newest `~/.claude/plugins/cache/yra-skills-public/tastestack/*/`, else the tastestack plugin directory (call it `<ts>`). Never use `<ts>/vendor/`, never run the impeccable CLI.

1. **Direction before drawing** (`tastestack:tastemaker-direction`): one line per decision (density, hierarchy, type scale, colour roles, motion) with its reason, from the app's archetype. The app's own tokens still win (rule 3); direction picks how to use them.
2. **Theme:** ask which theme the boards use when the app has more than one; default light first, and draw the other theme only when asked (owner, 2026-11-08).
3. **Reuse real pieces** (rule 4): when the owner has a component catalogue (B1 Clean pieces, live at uiux.yraveragehub.io), port its markup and CSS onto the app's tokens instead of drawing look-alikes. Name the catalogue piece in the board's "Where it lives" card.
4. **Critique each board** (`tastestack:impeccable`, `<ts>/skills/impeccable/reference/critique.md` + `audit.md`): score it, fix P0 to P2 before showing it. Keep the score per board for the status board.
5. **Who draws:** boards go to a strong worker (Sonnet or better); cheap workers draw placeholder boxes (see lessons). The lead judges the first board's render before the rest are drawn.

## Phase 5: Check before anyone sees it

**Design gate (rule 14), before the anatomy lint:**
- Slop scan every board file (or the generated file): `node "<ts>/skills/tastemaker-guard/scripts/slop-scan.mjs" <files> --fail-on error`. Quote the `score N (letter) · E errors · W warnings` line; 0 errors, each warning fixed or explained.
- Contrast for every doubtful text pair: `node "<ts>/skills/tastemaker-tokens/scripts/contrast.mjs" <fg> <bg>`; body text 4.5:1, large text 3:1. Quote the ratios.
- Owner comment says "slop" or "not good enough": run `tastestack:tastemaker-audit` on that board, apply its P0 to P2 fixes, reply on the thread with the before and after score.

Run `node scripts/lint_boards.mjs <boards-dir> [--after-only] --manifest <app>/canvas-states.json` first: it fails a board without notes, markers, the four aside cards, a `data-screen` ID, feature-ID stories, a `data-feature` on every marker and `data-does` control that is listed in Stories (rule 17), an Exists/Missing line per Partial story, or the toggle the user asked for, and (rule 15) a board without a States card, a state without Entry or Data, a switch button with no States row, more than 6 states, a control without `data-does` / `data-later`, or a `data-later` without its LATER tag. `--manifest` writes every board's states, entries, data sources and controls to one JSON file: that file is the checklist the app harness must cover when `/canvas-to-app` builds it. Then run `scripts/render_boards.mjs` on every board. It fails on console errors, broken images and horizontal overflow, and it records heights for the canvas index. Then look at contact sheets yourself. Click Before on at least one board.

Report what was not checked. A passing script does not prove the design is right.

## Phase 6: Hand off to /canvas-to-app

Building is not part of this skill. When the user asks to build, or the canvas is approved:

1. Make sure these exist and are current: the Claude Design canvas `url`, the generator and its sample data files in the app repo, `canvas-states.json` from the Phase 5 lint, the status board.
2. Write them into the app's handoff (`docs/handoff/<slug>.md`) under "Canvas".
3. Run `/canvas-to-app` with the canvas url (or the generator folder). It reads the manifest, maps the codebase, builds screen by screen and runs the State gate (rule 16).

## Phase 7: Learn

Do this at the end of every run, also a short one. It takes two minutes.

1. List what surprised you: a defect a check missed, a rule the owner stated, a trap in the repo, a step that cost time, a thing that worked well.
2. For each, check `lessons.md` first. Skip what is already there.
3. Add the new ones, one line each, general enough to help another app, with the evidence:
   `node scripts/memory.mjs add --lesson "..." --evidence "<commit, file or session>" --project <slug>`
4. Write the app's own facts to its project file: `node scripts/memory.mjs note --project <slug> --text "..."`. Owner rules, claimed files, failing gates, open owner decisions, URLs.
5. If a lesson already in memory was wrong or did not help, say so in the reply and edit `lessons.md` directly. Memory that cannot be corrected goes stale.
6. If the Inbox has more than 10 lines, fold them into the themed sections and drop duplicates.
7. If this run exposed a gap in a script or in this file, fix it in the spec-to-canvas plugin source and bump the version in `.claude-plugin/plugin.json`.

## Sibling skills

- `/spec-to-canvas:spec-to-canvas-nohtml`: one static HTML page, no interaction.
- `/spec-to-canvas:spec-to-canvas-html`: interactive HTML design canvas (multi-board, toggles, click handlers).
- `/canvas-to-app` (separate plugin): builds any canvas into the app.

All three ask the Before / After question first (and the reference-snapshot question when there is a reference product) and share `references/board-anatomy.md`.

## Stop conditions

Done means every row in scope has a board or a stated reason, every board passes the design gate, the anatomy lint and the render check, `canvas-states.json` is written, the canvas is published, the status board matches the requirement table, and Phase 7 ran. "Mockup looks good" is not done. Built status comes only from `/canvas-to-app` and its State gate: say plainly when a row is only drawn.

## Output

Give one link per change; the canvas link is always the Claude Design `url` (plus the offline file link when that was chosen). Say what you added to memory (count, one line each). List what was skipped or unchecked, and any risk, in one or two lines.
