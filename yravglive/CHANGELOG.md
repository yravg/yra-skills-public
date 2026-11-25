# Changelog

## 0.3.0 · 24 Nov 2026
- Discovery: each refresh reads the repo itself, not only the team file. Every git worktree becomes a monitor
  (changed files by time, commits ahead of main, processes working inside it); a "Repo" monitor lists recent merges
  to main and open PRs with CI. Team file keys: `discover` (default true), `stale_hours` (default 6).
- A failed `gh` call keeps the last good PR list instead of caching an empty one.
- A merged PR outranks an old error at the end of a worker's log.
- The title warns when the checkout is behind origin/main (parity reads files on disk).

## 0.2.0 · 24 Nov 2026
- Parity heatmap (from Clausarium /live/): the team file's `parity.command` prints parity JSON, served at
  `/parity.json` and drawn above the agent tree. Kinds come from the data. Reference exporter: Spekin
  `tools/live/parity-export.mjs` (canvas states, features, PRD requirements).

## 0.1.2 · 24 Nov 2026
- `/health` and an `x-yravglive` header on every answer, so a check can prove which app answered.
- SKILL.md: a hand-over check on both `localhost` and `127.0.0.1`, reserved Clausarium ports, and a
  "Mistakes we already made" list (port clash, ps truncation and ENOBUFS, ignored dist, Tailscale path, library look).

## 0.1.1 · 24 Nov 2026
- Default port 33207 (33107 is the Clausarium API). The server now refuses to start when any program holds the
  port on any address: macOS allowed `127.0.0.1:33107` and `*:33107` side by side, and the browser reached the
  Clausarium app instead of this page.

## 0.1.0 · 24 Nov 2026
- First version, from the Spekin IMP-43..46 worker run: Node feed server (`scripts/live-workers.mjs`), yravg UI page
  (Agent Tree + Agent Monitor) built into `dist/`, team file, Tailscale sharing. Ported from the Clausarium /live/ page
  without Python.
