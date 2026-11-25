---
name: testsprite-test
description: "Use when asked for /testsprite-test, a TestSprite-style QA pass, or test strategy, cases and results for an app. Writes qa/strategy.md, qa/cases.json, runs Playwright with a reporter that writes qa/runs/*.json and evidence, and can use the real TestSprite CLI too."
version: 1.0.0
platforms: [windows, macos, linux]
metadata:
  hermes:
    tags: [testing, qa, playwright, testsprite, evidence]
---

# /testsprite-test

This gives any web app the TestSprite layout: a **test strategy**, **test cases** (TC001, TC002 and so on) and **dated runs** with screenshots and video for each case. Results come only from real runs. A case that never ran shows as `not_run` and is never marked as passed.

It works in Claude Code, Cursor, Codex, Orca and Hermes, from a terminal or a desktop app. Everything goes through `node` scripts with no install step.

## How this relates to TestSprite

| | This skill (local) | TestSprite CLI (`@testsprite/testsprite-cli`) |
|---|---|---|
| Runner | Playwright on this machine | TestSprite cloud browsers |
| Cost | free | credits per run, API key |
| Test format | `qa/cases.json` plus Playwright specs titled `TC001 ...` | plan JSON (`planSteps`) |
| Output | `qa/runs/<run>.json` and `qa/evidence/<run>/` | cloud results and failure bundles |
| Data | stays on the laptop | app reached through their tunnel (`--local <port>`) |

Use the local path by default. Use the TestSprite CLI only when the owner wants cloud runs or AI-generated test plans. Its results can be pulled into `qa/` (step 6), and from there they reach the Hub through `/testsprite-test-to-hub`.

Scripts live in `~/.yraverage/qa/` (on Windows, `%USERPROFILE%/.yraverage/qa/`):
- `qa-init.mjs`: scaffolds `qa/`. It never overwrites a file.
- `qa-reporter.mjs`: a Playwright reporter that writes the run file and copies the evidence.
- `testsprite-import.mjs`: turns `testsprite test list --output json` into a qa run.
- `qa-to-hub.mjs`: sends a run to the yraverage Hub (see `/testsprite-test-to-hub`).

## The qa/ contract

The yraverage Hub's Tests tab reads this layout, as parsed in `apps/hub/src/domain/qa.ts`. Keep to it exactly:

```
qa/strategy.md                 scope, approach, environments, exit criteria
qa/cases.json                  [{ id:"TC001", title, priority:"high|medium|low", feature?:"02", description, steps:[...] }]
qa/runs/<run-id>.json          { id, at:<epoch ms>, commit?, results:[{ case:"TC001", status:"pass|fail|skipped|not_run", durationMs?, note?, evidence:["<run-id>/TC001-1.png"] }] }
qa/evidence/<run-id>/...       png, jpg, webp, mp4 or webm only, as paths relative to qa/evidence/
```

Case ids match `TC\d{3,}` and are unique. Write each case so someone with no access to the code can check it.

## Steps

1. **Read the project.** Read its `CLAUDE.md` or `AGENTS.md`, the PRD and the features, and work out how the app starts and on which port. Never use the owner's own dev server port: for yraverage Hub that is 49099 or 3000. Start your own server on a free port.
2. **Scaffold:** `node ~/.yraverage/qa/qa-init.mjs --name "<App>"` from the project root.
3. **Write the strategy and cases.** Fill in `qa/strategy.md`, then replace the sample case in `qa/cases.json` with real cases taken from the PRD's acceptance criteria. Use one case per user journey, mark the core flows `high` priority and set `feature` to the PRD feature number. Most apps need 5 to 15 cases.
4. **Write the specs.** Write one Playwright test per case, with the test title starting with its id: `test('TC003 guest books a court', ...)`. Use fixtures and mock data only: no real names, emails, tokens or project data, because the screenshots become evidence. If the project already has Playwright, add the specs there. If not, run `npm i -D @playwright/test && npx playwright install chromium`.
5. **Run with the reporter.** Turn on evidence and add the reporter, either in the config or as a flag:
   ```js
   // playwright.config: use: { screenshot: 'on', video: 'on' }
   reporter: [['list'], ['<HOME>/.yraverage/qa/qa-reporter.mjs', { qaDir: 'qa' }]]
   ```
   or `npx playwright test --reporter=list,<HOME>/.yraverage/qa/qa-reporter.mjs`. Give the reporter an absolute forward-slash path, because Windows paths with spaces break the `--reporter` flag.
   The reporter prints the run file path and which tests had no TC id. A test without an id is left out of the run, so give it an id.
6. **Optional: TestSprite cloud.** Only do this when the owner asks for it, because it spends credits.
   ```bash
   npm i -g @testsprite/testsprite-cli      # or: npx @testsprite/testsprite-cli
   testsprite setup                         # owner enters the API key; never type it yourself
   testsprite project create --type frontend --name "<App>" --local <port>
   testsprite test create --plan-from <case>.plan.json --project <id>   # name the test "TC003 ..." so it maps
   testsprite test run --all --project <id> --wait --output json
   testsprite test list --project <id> --output json | node ~/.yraverage/qa/testsprite-import.mjs
   ```
   `testsprite test failure get <test-id>` returns one bundle describing a failure. Fix the code, then run `testsprite test rerun`. Tests whose names do not start with a case id can be mapped through `qa/testsprite-map.json` (`{"test_abc": "TC003"}`). Use `--dry-run` on any testsprite command to learn the command with no key and no credits.
7. **Triage every failure.** Decide whether it is a product bug or a stale test. Fix a test only when the test is provably wrong. Never edit a run file to turn a fail into a pass. A new run is the only way to change a result.
8. **Report.** Give pass, fail and skipped counts, the run file path, each failure with its cause, and which cases were not run. If the project is linked to the Hub (it has `.yraverage/project.json`), continue with `/testsprite-test-to-hub`.

## Pitfalls

- **Git:** commit `qa/strategy.md`, `qa/cases.json` and the run JSON. Videos are large: gitignore `qa/evidence/` unless the project wants evidence in git.
- **Retries:** when a test is retried, the last attempt wins. When two tests share one id, any failure makes the case fail.
- **`NODE_ENV=production`:** some agent shells export it, which breaks React test builds. Prefix with `NODE_ENV=test` when vitest is involved.
- **Owner servers:** stop every server you started, and never stop one you did not start.
