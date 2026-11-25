# yraverageMilestone (project memory)

Repo: the yraverageMilestone project. Handoffs: `docs/handoff/v2-revamp.md`, `usable-b.md` (acceptance sweep), `otl-slide.md`. Roadmap `docs/roadmap/v2-revamp.md`, tracker `docs/roadmap/roadmap.html` on `boards.json`.
Parity reference: Kidasa Milestones Professional 2025 and Office Timeline Online (`docs/parity.md`, 48 built, 16 partly at 2026-10-22).

## How it was run
- PRD cards (EDITOR, RIBBON, WIZARD, SCHED, IO, GRID, SHELL, SLIDES, MLQ, RS-MLQ...) with IDs; rounds with parallel worktree agents, then a coordinator close-out merge.
- Per round: unit loop, engine-rs tests, editor-check (895 PASS), launch smoke (168), browser checks at 1440 and 390, light and dark, EN and ID.
- Deploy: auto redeploy on push to https://milestone.yraveragehub.io (`deploy/milestone-vps`).

## Owner pattern
- Says "pick the recommended option": record each choice as a Decision with its reason.
- Owner-account parts (cloud, signing keys) are built as local stubs with a visible "not connected" state.

## Known traps
- Machine memory is low: one browser check at a time; `hermes-bridge.test.mjs` is flaky in the full loop.
- CRLF clones break vendor SRI hashes (`.gitattributes` fixed).
- Do not commit `app/dist` when another session has uncommitted app changes.
- `.mpp`, `.bk3`, `.mpx`, Project Server stay documented gaps.

## Change log of this file
- 2026-11-03 seeded from the handoffs.
