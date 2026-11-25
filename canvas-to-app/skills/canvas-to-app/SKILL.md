---
name: canvas-to-app
description: Build any design canvas into the real app in one pass, without errors, keeping the codebase's own architecture, components, tokens and conventions. Reads the whole canvas (Claude Design canvas, spec-to-canvas boards and their canvas-states.json, an HTML canvas, Hub Studio pages, Figma frames or plain screenshots), maps the codebase, writes a contract per screen, takes a gate baseline, then builds screen by screen with tests first and proves each board state in the running app. Shares the canvas memory with spec-to-canvas. Use when the user asks to build, implement, port or ship a canvas, mockup, design or board set into the app, or to make the app match the canvas.
---

# Canvas to app

A canvas is the spec. The codebase is the law. This skill turns the first into the second without breaking either.

"One shot" comes from reading everything before the first edit and from gates that will not let a broken step through. It does not come from typing fast. Fifteen rules, each from a run that went wrong without it:

1. **The canvas is the spec.** The built screen equals the board: same labels, order, states, sample data. Each NEW tag is a build item, each PARTIAL a gap list, each callout note an acceptance test. What the canvas does not say, the codebase decides. Never invent.
2. **The codebase is the law.** Rebuild every board with the app's own router, layout, components, tokens, state store, data layer, i18n and file layout. Canvas markup is never pasted in. A look-alike component next to a real one is a defect.
3. **Copy the closest screen.** For every board, name the most similar existing screen and follow its structure (folder, file split, hooks, tests). New patterns, folders, dependencies or global styles need an owner decision with the reason no existing one fits.
4. **Add, never replace.** Existing routes, controls, commands, test ids and stored data stay. A control removed for a look is a defect.
5. **Read all, then plan, then edit.** Every board, every state, every comment, the manifest and the architecture map are read before the first edit. Questions go to the owner in one batch, before code.
6. **A contract per screen before code.** Board to route and files, element to component, control to handler, state to entry click path and data source, feature to test. No contract row, no code.
7. **Baseline first, then zero new failures.** `scripts/gate.mjs baseline` before the first edit; `gate.mjs check` after every screen. Pre-existing failures are recorded, never blamed on the build and never hidden.
8. **Never silence an error.** No `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, `any` cast, `.skip`, `.only`, deleted test, loosened assertion, raised threshold or caught-and-dropped exception to make a gate pass. Fix the cause.
9. **Test first.** Each board state becomes a failing test before its code: the Entry click path, the panel text, the `data-does` lines.
10. **A state is done only when the app harness passes it** (spec-to-canvas rule 16): reached by clicking from the start page (no `?view=` or deep-link shortcut), same text as the board, 1 % or less pixel difference, zero "Not built yet" controls. Drawn stand-ins are FAIL.
11. **IDs travel.** The screen root carries `data-screen="S03"`, each built control `data-feature="F123"`, the same IDs as the board. Commits, handoff and harness use them.
12. **Dead controls are defects.** Every `data-does` control does what its line says. A `data-later` control is drawn disabled with `title="Later: …"`. Never build a store or button nothing reads.
13. **A server, an account or a key is an owner decision.** Build the visible "not connected" state, send nothing, name the blocker.
14. **Independent review before done.** A fresh reviewer gets the diff and the architecture map, not your conclusions.
15. **Memory first, memory last.** Read the lessons before work; add what this run taught after.

## Find the helpers

- This plugin's scripts: `scripts/gate.mjs` beside this file.
- spec-to-canvas scripts (board lint, render, capture, memory): newest `<config>/plugins/cache/yra-skills-public/spec-to-canvas/*/skills/spec-to-canvas/scripts/` (`<config>` = `$CLAUDE_CONFIG_DIR`, default `~/.claude`), else the spec-to-canvas plugin's `skills/spec-to-canvas/scripts/` in a yra-skills-public checkout. Call it `<stc>`. If spec-to-canvas is not installed, say so; read and write the memory files directly and write the manifest by hand.
- Memory: `$CANVAS_TO_APP_MEMORY`, default `~/.claude/canvas-to-app-memory/` (`lessons.md`, `projects/<slug>.md`), shared with spec-to-canvas.

## Phase 0: Recall

1. `node <stc>/memory.mjs show <project-slug>` (no slug for a new app). Apply the lessons that touch this run; the user's words win over a lesson.
2. Read the app's handoff and roadmap for this feature if they exist (`docs/handoff/<slug>.md`, the roadmap path the repo uses). A handoff means resume: trust its done rows, continue from its next step.
3. Read the repo's `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`. Their rules win over this file where they are stricter.

## Phase 1: Read the whole canvas

Find the source, read all of it, and turn it into one manifest: `<app>/canvas-states.json`.

| Canvas source | How to read it |
|---|---|
| spec-to-canvas generator in the repo (`build.mjs` + sample files) | Read the generator and sample data; they beat the published HTML. Manifest: rerun `node <stc>/lint_boards.mjs <boards-dir> [--after-only] --manifest <app>/canvas-states.json` |
| Claude Design canvas (claude.ai artifact url) | `Artifact` `action: read` the url; `action: list`, `scope: files` for every file; read `project/canvas.json` and each `.dc.html` with `paths`; comments with `ArtifactComments`. Boards follow the spec-to-canvas anatomy: lint them for the manifest. |
| Interactive or static HTML canvas file | Read the file; click every toggle and state in a browser; screenshot each state at 1600x900. |
| Hub Studio pages | Export HTML from the Hub (`yraverage-hub:hub-studio` skill), then as an HTML canvas. |
| Figma | `figma:figma-design-to-code` / `figma:figma-use` to read frames, variables and components. |
| Screenshots or images only | Read every image. Everything not visible (behaviour, data, empty and error states) is marked `inferred` and goes to the owner question batch. |

When the source has no manifest, write it by hand in the lint's schema, one entry per board:

```json
{ "board": "S03-register", "screen": "S03", "features": ["F101", "F102"],
  "states": [{ "state": "register", "entry": "Projects > Meridian > Register tab", "data": "src/sample/meridian-register.js -> all rows" }],
  "controls": [{ "does": "Opens the COP page for the clicked row", "feature": "F102" }],
  "later": ["Export to Primavera"] }
```

Also note per board: every label in order, every NEW / PARTIAL marker (PARTIAL: what exists, what is missing), every callout note (each becomes a test), the sample data shown, the reference images to diff against.

Anything that blocks a contract row (a state with no click path, a control with no action, data with no source, a board that conflicts with an existing screen) goes on the question list. Ask the whole list once with AskUserQuestion, recommended option first. A control the owner does not decide becomes `data-later`; a state with no click path is cut, never faked.

## Phase 2: Map the codebase

Write the map into the roadmap (section "Architecture map"), each line with a `file:line` exemplar. Use graft when the repo is indexed (`graft_repo_map`, `graft_find_code`), else an `Explore` agent for breadth, then read the exemplars yourself.

- Stack, package manager, runtime versions, monorepo layout
- Where screens register (router, nav, command palette, menus) and the app's start page
- Layout shell, design system and house components (the catalogue the app already uses), tokens and theme files, icon set
- State management, data and API layer, where sample or demo data lives, how a project or record is loaded
- i18n, accessibility helpers, feature flags, error and empty-state components
- Tests: unit, component and e2e runners, how UI tests get past sign-in, any canvas state harness (`scripts/test-canvas-states.mjs`)
- Gate commands (typecheck, lint, test, build, e2e) and how CI runs them
- Conventions: naming, file split, import aliases, lint rules, commit style, CHANGELOG
- Live claims: other sessions' worktrees, branches or claimed files (Orca, handoffs, `git worktree list`)
- **Closest screen per board** (rule 3)

## Phase 3: Plan

1. **Screen contract** per board, in the roadmap. One table per screen:

   | Canvas item | App target | Reuses | New | Test |
   |---|---|---|---|---|
   | S03 root | `src/screens/Register.tsx`, route `/projects/:id/register` | layout of `Cops.tsx` (closest screen) | none | `register.spec.ts` |
   | F102 row click (`data-does`) | `onRowOpen` in `useRegister` | `DataTable` | handler | e2e: click COP-014, sees COP page |
   | state `cop` | Entry: Register, click COP-014 | `meridian-register.js` | none | harness row |

2. **Order:** shared data and sample files first, then shared components the boards need, then screens by dependency, then by value. A screen that touches another session's claimed files is `blocked`, named, and skipped.
3. **Roadmap and handoff** before code (global rule for big features): roadmap = goal, contract tables, order, open questions; handoff = status table per screen (`open`, `in progress`, `done`, `blocked`, with evidence), next step.
4. **Who builds:** one screen = one unit of work. For more than two screens, delegate per the owner's worker rules (Sonnet workers, checkpoint file, brief that names the roadmap, the handoff, the contract table and the files the worker owns). The lead keeps shared files (router, tokens, sample data, harness) and the combined gate. The lead judges the first built screen against its board before the rest start.

## Phase 4: Baseline

1. Branch or worktree per the repo's habit. Never on a branch another session works on.
2. `node scripts/gate.mjs baseline --dir <app>` (add `--cmd "<e2e command>"` for slow suites that must also stay green). Write the pre-existing failures into the handoff.
3. Capture the screens the build will touch (`node <stc>/capture.mjs`): screenshots and page text are the "no control lost" reference.
4. Start the dev server once; note its port and pid in the checkpoint; reuse it.

## Phase 5: Build, one screen per loop

For each screen, in contract order:

1. **Failing tests** from the board: one per state (Entry click path, panel text) and one per `data-does` line and callout note. Run them; they must fail for the right reason.
2. **Build** with the reused pieces the contract names, in the closest screen's structure. Tokens from the token files, strings through the i18n layer, sample data from the shared sample file (the board and the app read the same file). `data-screen` and `data-feature` on the elements.
3. **Wire every control** to the existing command or store; LATER controls disabled with their title.
4. **Gate:** the screen's tests green, then `node scripts/gate.mjs check`. A failure: read the full error, fix the root cause in shared code once, rerun. The same error three times: stop, write it to the handoff with what was tried, ask the owner.
5. **State gate** for every state of the board (below).
6. **Look at it:** the screen at 1600 and 1024 wide, 390 when the app supports mobile, keyboard only, no project open, longer strings, reduced motion, dark and other languages when the app has them. No console errors or warnings.
7. **Commit** the screen alone: `git diff --cached` first (a shared index can hold another session's files), `git commit -- <paths>`, message names the screen and feature IDs. CHANGELOG entry when the repo keeps one.
8. **Handoff:** the screen's row to `done` with the commit SHA and the tests by name, or to its honest status.

### State gate

The app keeps one harness (for example `scripts/test-canvas-states.mjs`) that reads `canvas-states.json` and prints one line per board state: `PASS`, `FAIL <reason>` or `DRAWN`. Write it in the first screen's loop when the app has none, with the repo's own browser test runner. A state missing from the harness is FAIL. Each manifest board has a `hash`; a changed hash puts its states back to FAIL until rerun. Per state:

1. Open the app at its start page with the sample project and perform the Entry clicks with real mouse and key events. Any URL shortcut fails the state.
2. The screen root carries the board's `data-screen`; every board `data-feature` exists in the DOM. Panel text equals the board's (same strings, same order), values from the state's Data file.
3. A screenshot of the window region differs from the board render by 1 % or less (pixelmatch or the repo's tool; print the threshold).
4. Zero "Not built yet" controls (LATER excepted). Each `data-does` control is clicked once and does what its line says.
5. A state served by a generated or static stand-in reports `DRAWN`, which fails.

The sample project the boards use stays in the app's project list, so the owner can compare app and board side by side.

## Phase 6: Verify the whole

1. `node scripts/gate.mjs check`: no new failures. Quote its last line.
2. The harness: every state PASS. Quote the counts.
3. Drive the main flows with real input across screens; exports checked with an outside tool, not the app's own reader.
4. Compare the "no control lost" capture from Phase 4 with the new page text: every old command still present.
5. **Independent review** (rule 14): a fresh reviewer (gstack `/review`, or an agent with the diff, the architecture map and the contract tables, not your verdict) checks architecture fit, duplication of existing helpers, dead code, silenced errors, and missing states. Fix the real findings, rerun steps 1 and 2.
6. Stop every server, runner and browser you started.

## Phase 7: Learn

1. List what surprised you: a defect a gate missed, an owner rule, a repo trap, a step that cost time, a thing that worked.
2. Skip what `lessons.md` already holds. Add the rest, one line each, with evidence: `node <stc>/memory.mjs add --lesson "..." --evidence "<commit or file>" --project <slug>`.
3. App facts to the project file: `node <stc>/memory.mjs note --project <slug> --text "..."` (gate commands, harness path, closest screens, claimed files, open owner decisions).
4. A lesson that was wrong: say so and fix `lessons.md`.
5. A gap in this skill or `gate.mjs`: fix it in the canvas-to-app plugin source, bump `.claude-plugin/plugin.json`, add a CHANGELOG line.

## Done

Every screen in scope is `done` or has a stated status and reason; every manifest state reports PASS; `gate.mjs check` shows no new failures; the review findings are fixed or answered; the handoff and status match the commits; nothing you started is still running; Phase 7 ran. "Looks like the canvas" is not done. Never round "partly" up: `done`, `done, part blocked`, `done, part open`, `open`, `blocked`.

## Output

One link per change: the running app at the exact route (dev server left running only when the owner wants it), the PR, or the deployed URL; plus the canvas url beside it. Then the gate line, the harness counts, the screens by status, what went into memory, and one or two lines on what was skipped or unchecked and any risk.
