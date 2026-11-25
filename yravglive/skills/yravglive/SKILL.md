---
name: yravglive
description: Live page for headless agent workers in any repo - one yravg UI page (Agent Tree + Agent Monitor from uiux.yraveragehub.io) that refreshes every 5 s with each worker's status, tool steps, branch, commits, pull request and CI per job, and log tail. Use for /yravglive, when the owner asks to "see the workers", "live worker page", "make it live like Clausarium", when workers run headless (opencode run, agy, codex, cursor agent) and have no Orca tab, or to add, restart, or upgrade the live page.
---

# yravglive

One page that shows what headless agent workers are doing right now. It is the Clausarium /live/ idea, made
portable: Node only, no Python, no build step in the target repo, drawn with the owner's yravg UI library
(Agent Tree and Agent Monitor, uiux.yraveragehub.io, ported from affectUI under MIT; see `THIRD_PARTY_NOTICES.md`).

`SKILL_DIR` below is this folder (the one holding this file).

## What the page shows

- **Agent Tree**: the lead and one node per worker, with status (running, done, failed, queued) and elapsed time.
- **Agent Monitor per worker**: current line, the last 25 tool steps parsed from its log (Read, Grep/Glob, Edit/Write,
  shell commands, failures), running clock.
- **Facts per worker**: model, branch, commits ahead of `origin/main`, changed files, step count, log age,
  pull requests for its branches with each CI job's result (green, red, pending, merged), last 12 log lines.
- Feed age in the header: over 30 s means the feed server stopped.

The page polls `/live.json` every 5 s. GitHub is asked at most every 30 s. Nothing is invented: logs carry no
timestamps, so the page shows no per-step durations and no cost.

## Parity heatmap (optional)

Clausarium's feature-parity heatmap, for any repo: one cell per required item, coloured by state (Missing, Name only,
Unmapped, Open, Partial, Renders, Proven, Dropped), a weighted score, a kind × state table, and a searchable row list
with the reason and evidence for every cell. The page shows it when the team file has a parity command:

```json
"parity": { "command": "node tools/live/parity-export.mjs", "every": 60 }
```

The command runs in the repo at most every `every` seconds (never twice at once) and must print one JSON document:
`{title, kinds?, search?, updated, commit, score, counts, by_kind?, invalid?, features: [{id, fid, title, status, note,
cells: [{k, kind, w, s, why, ev?}]}]}`. `kind` is free (board, state, feature, req, route, ...); `kinds` sets the order.
`/parity.json` serves the last good answer.

Write the exporter in the repo, in the repo's own language rules, and judge "proven" only from real evidence
(a test or harness result, the code itself), never from a claim in a doc. Spekin's `tools/live/parity-export.mjs` is the
reference: board states from the harness report, canvas feature ids found in the app source, PRD requirements through
the feature-to-requirement map. Show the evidence's age in `title` (for example the harness run time).

## 1. Write the team file

Put it in the repo (for example `tools/live/team.json`), paths relative to the repo root:

```json
{
  "title": "Spekin live workers · IMP-43 to IMP-46",
  "lead": { "name": "Lead", "model": "Claude Code", "task": "Reviews each PR; merges only on green CI" },
  "workers": [
    { "id": "A", "title": "Spekin A", "model": "opencode-go/hy4", "cards": "IMP-43 → IMP-45",
      "worktree": "../Spekin-core", "log": "../worker-A.log",
      "branches": ["imp-43-skills-audit", "imp-45-door-and-offline"] }
  ]
}
```

- A worker counts as running while a process whose command line contains `match` is alive. Default `match` is
  `--title <title> ` (the `opencode run --title` convention). For other CLIs set `match` to a unique part of
  the command line, for example `"match": "agy -p"` plus the worktree path.
- `branches` lists every branch the worker will push, so its pull requests appear even after it moves on.

## 2. Launch workers so the page can see them

Each worker gets its own worktree, its own log file and a unique title:

```sh
cd ../Spekin-core && nohup opencode run -m opencode-go/hy4 --title "Spekin A" "$(cat prompt-A.txt)" > ../worker-A.log 2>&1 &
```

Give parallel workers separate dev-server and API ports in their prompts.

## 3. Start the page

From the repo root:

```sh
nohup node "$SKILL_DIR/scripts/live-workers.mjs" tools/live/team.json --port 33207 > /tmp/yravglive.log 2>&1 &
```

Open http://127.0.0.1:33207/. Flags: `--port`, `--host` (default 127.0.0.1), `--repo` (default the current folder).
Use a different port per repo if two pages run at once (33207, 33208, ...). Never use 33106 or 33107: they belong to
Clausarium (its /live/ page and its API). The script refuses a port another program holds on any address; if it
exits with "already in use", pick the next free one (`lsof -nP -iTCP:<port> -sTCP:LISTEN` prints nothing when free). Edit the team file at any time;
it is read on every poll, so no restart is needed.

Give people the localhost URL. Do not record a private network hostname in this repo.

Stop the page: `pkill -f "yravglive/scripts/live-workers.mjs"` (or kill the pid in `/tmp/yravglive.log`'s shell).

## 4. Check it before you hand over the link

Check the way the owner's browser will reach it, not only the address you started it on:

1. **Exactly one program on the port:** `lsof -nP -iTCP:<port> -sTCP:LISTEN` shows one line, a `node` process.
2. **It is this page on every address:** `curl -s http://localhost:<port>/health` and `curl -s http://127.0.0.1:<port>/health`
   both return `{"app":"yravglive", "repo": <this repo>, ...}`. Anything else (HTML of another app, a different repo,
   no answer) means the link is wrong: stop and fix it before you send it.
3. **The data is right:** `curl -s http://localhost:<port>/live.json` lists every worker with the right `state`,
   `branch` and pull requests.
4. **The page renders:** open `http://localhost:<port>/` in a real browser (Playwright is fine) at 1440 px and 390 px:
   0 page errors, no sideways scroll, the tree and one monitor per worker are drawn. Look at the screenshot.
5. Give the owner the `localhost` URL. When you change the port, update the handoff note.

## Mistakes we already made (do not repeat them)

- **Port clash, wrong app shown (24 Nov 2026).** The first version used 33107, which the Clausarium API holds on
  `*:33107`. macOS let this page bind `127.0.0.1:33107` beside it, the agent's `curl 127.0.0.1` saw this page, and the
  owner's browser got the Clausarium app. Fix: default 33207, the start-up refusal, and the `/health` check on both
  `localhost` and `127.0.0.1` above.
- **"Running" shown as stopped.** `ps` cut long command lines (needs `ww`), and the full process list passed Node's
  1 MB buffer (`ENOBUFS`), so every worker looked stopped. Fix: `ps -axww`, an 8 MB buffer, and match on a short
  unique `match` string. After any change to process matching, compare the page with `pgrep -fl`.
- **Built page missing from git.** A repo-wide `.gitignore` can ignore `dist/`. Check `git ls-files dist` after a
  rebuild and `git add -f dist` when needed: target repos run the committed `dist/`.
- **Tailscale CLI not on PATH** on the owner's Mac: use `/Applications/Tailscale.app/Contents/MacOS/Tailscale`.
- **The page showed a list, not the repo (24 Nov 2026).** It only knew the workers hand-written in the team file.
  Four Claude subagents drew boards in a worktree and a PR was opened and merged, and the page showed none of it,
  while workers that had finished hours earlier still looked current. Fix (0.3.0): every refresh also discovers each
  `git worktree` (uncommitted files by modification time, commits not on main, processes whose working folder is
  inside it via `lsof -d cwd`), plus one "Repo" monitor with recent merges to main and open PRs with CI. Listed
  workers idle longer than `stale_hours` (default 6) drop off. Never rely on the team file to say what is going on.
- **A failed GitHub call cached as "no pull requests".** On a network drop `gh` printed nothing and the page cached
  an empty list, so merged workers said "No pull request". Fix: keep the last good list and retry in 10 s.
- **An old log error outranked a merged PR.** A worker whose log ended in "usage limit" stayed "failed" after its
  work was merged another way. A merged PR now wins.
- **Parity read an old checkout.** The parity command reads the files on disk; the main checkout was three merges
  behind origin/main and the harness report was a day old, so the numbers described old code. The title now says
  "checkout N commit(s) behind origin/main". When you merge, fast-forward the checkout the page reads
  (`git pull --ff-only`, never `git stash` first) and rerun the harness that feeds parity.
- **Hand-over check (add to step 4):** while a worker is busy, `/live.json` must show its worktree as `running`
  with the file it touched last. If anything you know is happening is missing from the page, the page is broken.
- **A plain HTML page instead of the library.** The owner wants the yravg UI components (Agent Tree, Agent Monitor),
  the Clausarium /live/ look, not a hand-made table. Extend `app/src` with library items; do not replace them.

## Upgrade the page

The built page is committed in `dist/`, so target repos need only Node. To change it:

```sh
cd "$SKILL_DIR/app" && npm install && npm run build   # writes ../dist
```

- UI components live in `app/src/ui/` (copied from the yravg UI library: `agent-tree-b1.tsx`,
  `agent-monitor-b1.tsx`, `_shared.tsx`, `yravg-ui.css`). To take a newer library version, copy the new files over,
  rebuild, and keep `THIRD_PARTY_NOTICES.md` current.
- Page layout: `app/src/main.tsx` and `app/src/live.css` (tokens only, no raw colours outside the token block).
- Feed shape: `scripts/live-workers.mjs` (`feed()`); add log patterns for a new CLI in `KINDS`.
- Record each change in `../../CHANGELOG.md` and bump `.claude-plugin/plugin.json` `version`.

Later this can become a mod (a pane beside the chat that reads the same `/live.json`); the feed server stays as is.

## Rules

- Never show sample or replayed data as live. If the feed has no workers, the page says so.
- Never print a price or duration the logs do not carry.
- Keep the repo's own rules: in a repo with a no-Python rule this tool is fine (Node only).
- The repo's handoff names the team file and the start command, so any agent can restart the page.
