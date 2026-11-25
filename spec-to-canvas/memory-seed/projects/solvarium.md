# Solvarium (project memory)

Repo: the Solvarium project. Handoffs: `docs/handoff/canvas-boards.md`, `docs/handoff/main-pages-ui.md`. Roadmaps in `docs/roadmap/`.
Canvas (Claude Design): https://claude.ai/artifact/1MrkeNLectNJjwzs9nv3bv ; main pages: https://claude.ai/artifact/AmXz7g3yiR7yF9LxJw2L6k page "Main pages".

## How it was run
- PRD rows S01..S27 (scheduling features), steps per board in the roadmap. 15 steps; 1-8 and 15 done by 2026-11-02, 9-11 open (S14 wiki, S16 import, S21 admin), 12 blocked by overlap with the main-pages wave.
- Main pages: 19 artboards, triage table, owner approved build 2026-11-01, one commit per page in table order, guard `test:design-ui` (`MAX_RAW_SELECTS` goes down as pages move to `Select`).
- Design source copied to `app/vendor/yravg-a1` and `yravg-b1`.

## Owner rules
- No control removed for a look (SolvaDrag keeps `rail-drag-left`).
- Simulate histogram stays unless something is added.
- Every rebuilt board has Before and After.
- 1024 px, longer strings, keyboard, no project open, stored layout kept.

## Known traps
- `CHANGELOG.md`, `agentChat.js`, `Ribbon.jsx` are often claimed by another session.
- Fast gate: `test:ids`, `test:safe`, `test-whatsnew-ui`, `test-alerts-window`, `test:acumen-risk-golden` failed on 2026-11-02; only the first two came from this wave.
- Owner decisions open: objective builder (OPT-004), strict mode (OPT-001), Run overnight (needs server side).

## Change log of this file
- 2026-11-03 seeded from the two handoffs.
