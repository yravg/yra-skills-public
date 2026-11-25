# canvas-to-app

A Claude Code plugin: build any design canvas into the real app in one pass, without errors, keeping the codebase's own architecture.

Up to 0.6.0 this name belonged to the drawing plugin; that one is now `spec-to-canvas` (`../spec-to-canvas`). The pipeline is:

```
PRD / spec  --/spec-to-canvas-->  canvas + canvas-states.json  --/canvas-to-app-->  built, tested app
```

## Install

```
claude plugin marketplace add yravg/yra-skills-public
claude plugin install canvas-to-app@yra-skills-public
claude plugin install spec-to-canvas@yra-skills-public  # its lint, capture and memory scripts are used here
```

## Use

Type `/canvas-to-app` with the canvas: a Claude Design url, a spec-to-canvas generator folder, an HTML canvas, Hub Studio pages, Figma frames or screenshots.

> /canvas-to-app https://claude.ai/artifact/... into the app repo. Build every board.

## How it gets it right the first time

| Phase | Does |
|---|---|
| 0 Recall | Canvas memory, handoff, repo rules |
| 1 Read | Every board, state and comment into `canvas-states.json`; owner questions in one batch |
| 2 Map | Architecture map with `file:line` exemplars and the closest existing screen per board |
| 3 Plan | Contract table per screen, order, roadmap and handoff |
| 4 Baseline | `gate.mjs baseline`, "no control lost" capture |
| 5 Build | Per screen: failing tests, build with house pieces, `gate.mjs check`, State gate, commit |
| 6 Verify | Full gate, every state PASS, real-input flows, independent review |
| 7 Learn | Lessons and project facts into the shared memory |

## Scripts

| Script | Does |
|---|---|
| `gate.mjs baseline` | Runs typecheck, lint, test, build (from `package.json`, or `--cmd`) and records what passes before the build |
| `gate.mjs check` | Reruns them; exits 1 on any new failure, or when a failing command's error count grows |
| `gate.mjs self-check` | Tests the script itself |

Board lint, render, capture and memory scripts come from `spec-to-canvas`.
