---
name: crawl-live
description: Use when you need the full list of what a running web app really offers (Solvarium on http://localhost:33033 by default) before writing a PRD, a mock-up or a test. Opens the app in Playwright, read-only, and records every button, field, select, table column, heading and test id per screen, sub-screen, tab and popup.
---

# /crawl-live: record every control of the live app

The live app is the reference. Mock-ups, PRDs and coverage claims are checked against this record, never against memory.

## Run

From the repo root (or any worktree; the app must be served, `start.bat` gives :33033):

```
node .claude/skills/crawl-live/crawl-live.mjs --out <dir>              # full walk, about 13 min
node .claude/skills/crawl-live/crawl-live.mjs --quick --out <dir>      # screens and sub-screens only, about 4 min
node .claude/skills/crawl-live/crawl-live.mjs --url http://localhost:33044 --out <dir>   # another port or app
```

`--out` defaults to the current folder. Playwright is taken from the cwd, `cwd/app` or the git root `/app` (`cd app && npm install` if missing).

Output `<dir>/live-features.json`:
`{ url, at, errors, failedClicks, surfaces: { "<surface>": { items: [{ kind, label, testid, region, tip, disabled, options?, checked?, value? }], skipped: [] } } }`

- `kind`: `button | link | tab | input:<type> | select | textarea | field-label | column | heading | region`.
- Surfaces: `home`, `group:<hdr group>`, `menu:<rb-m-*>`, `screen:<tab>[:<sub>]`, `chrome:<testid>` (header popups, rail flyouts, status bar), `gantt:*` (panels open, a row selected, the three views).
- `skipped` = controls not clicked because their label sounds mutating; `failedClicks` = test ids the crawl could not open. Report both, do not hide them.

## Read the result

Print counts first, never paste the file (it is several MB): per surface `items.length`, then grep a label or test id.

For the Solvarium four-panel mock: `docs/prds/ui-v3/` has `reach.mjs` (what the mock draws) and `live-report.mjs` (dedupes into `live-record.json` and `live-features.html`, lists every control with an "in mock" pill, fails on a leaked file name). Order: crawl, `node reach.mjs`, `node live-report.mjs`, `node build-mock.mjs`.

## Rules

1. Read-only. A tab-like control is clicked only when its label and test id have no word from `MUTATING` (save, delete, apply, import, level, optimize, run, share ...). Header Level / Optimize are never clicked.
2. Client data policy: file names from the project folders are never written (labels that look like files become `<file name>`, `lib-file-*` is dropped). `live-features.json` is raw: git-ignored, never committed. Commit only the deduplicated `live-record.json`.
3. Only the Riverside demo state is walked. States that need other data (Spider profile, levelled plan, other roles) are not visited: say so in the report.
4. Another app: the Solvarium walk (header groups, `rb-cl-screens`, rail, Gantt) finds nothing and degrades to the landing page plus its tabs and popup openers. For deeper coverage add that app's navigation to the script, keeping rules 1 and 2.
5. Do not run two crawls on one server at once (the app keeps state in localStorage). Do not use the crawl to change data.

## Maintaining

Repo copy `.claude/skills/crawl-live/` is the source. The user-level copy in `~/.claude/skills/crawl-live/` is a plain copy for sessions without this checkout; refresh it after changes.
