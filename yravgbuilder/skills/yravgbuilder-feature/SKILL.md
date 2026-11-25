---
name: yravgbuilder-feature
description: Feature delivery standard for business apps - PRD row to shipped feature with a contract-first pure core, typed results, a failing hand-computed test, suites wired into CI, coverage matrix and design canvas before code for big or parity work, Before/After boards, samples + demo + in-app how-to, CHANGELOG and What's new, roadmap and handoff files. Use when planning, building or finishing any feature, port or parity screen, or when deciding whether a feature is done.
---

# yravgbuilder feature

Done means a user can find it, try it on sample data, and trust its numbers. Gate: `../yravgbuilder/SKILL.md`.

## 1. Before code

- Write the PRD row: id `AREA-NNN`, priority P0-P2, acceptance as observable checks, status `missing | partial | done`.
- Big feature (more than one session or agent): roadmap (`docs/roadmap/<feature>.md`: goal, gaps, numbered steps with acceptance, open questions) and handoff (`docs/handoff/<feature>.md`: status table, known failures, exact next step) before any code.
- Parity or port of a reference product: first a coverage matrix of every PRD row and every reference screen, then a canvas of every screen in the app's real chrome. Build only after the owner signs off. Clean room: no copied logos, assets or text.
- Canvas: draw with the `spec-to-canvas` plugin skills (`spec-to-canvas:spec-to-canvas` or `-html`), build with `/canvas-to-app`. Every rebuilt board has working Before / After toggles (Before = real screenshot). One synthetic sample project across all boards.

## 2. Contract-first core

Every logic module starts with a header:

```js
// Contract: computeAging(invoices, asOfDay) -> { buckets: [{label, from, to, count, amount}], total }
// Units: amounts in minor units (integer cents); days are integer day numbers (UTC).
// Refuses: { error: "asOfDay must be an integer" } for bad input; never throws on user data.
// Source of rule: finance policy FIN-12 (or ASSUMED: <why>, <support count>).
```

- Pure: no DOM, `fetch`, `Date.now()`, `Math.random()` (seeded RNG), `localStorage`. JSON in, JSON out.
- Typed results: `{ ok: true, value }` or `{ error, code }`; the view shows the error text.
- Deterministic: stable sorts with full tie-break; integer money and day numbers.
- Thin view: the component calls the core and renders. No business rule in JSX.
- Writes to shared state go through one door (for example `api.commit(edited, label)`) so undo and audit work.

## 3. Test first

1. Write a hand-computed case in `scripts/test-<topic>.mjs` (or the repo's runner). Run it; watch it fail for the right reason.
2. Build until it passes. Add one case per refusal and per edge (empty, one item, ties, max size).
3. Wire the suite in the same commit: `package.json` script + the CI list + the workflow file. A suite nobody runs does not exist.
4. UI check: real mouse and keyboard in Playwright against the dev server, wait on conditions, never fixed sleeps. Stop every server and browser you started.
5. Exports (xlsx, pdf, pptx) opened and checked with an outside tool (openpyxl, pypdf, python-pptx).

## 4. Ship with samples

A feature without demo data reads as missing.
- Sample data (synthetic or openly licensed, never client data) reachable from the app's samples or demo entry.
- The demo project exercises every feature.
- In-app how-to: steps plus which sample to open. A tour step points at a real `data-testid`.
- Release note: CHANGELOG entry under Unreleased in the same push; What's new entry if the app has one.

## 5. Commit and report

- One unit per commit, explicit paths (`git commit -o <paths>`), never `git add -A`. Body ends with the card code (`PRD: AREA-NNN`).
- Status words: `done`, `done, part open`, `open`, `blocked`. Never round partly up. Every claim says how it was checked.
- Update the handoff after each finished step.
- No client codes, names or files in tracked files or commit messages.
