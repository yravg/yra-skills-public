---
name: yraverage-hub
description: Link a project folder to the yraverage Hub (http://localhost:49099 by default) so its Projects page shows the latest documents, git state and cards; start new projects from the Hub's codebase templates, including the install prompt a template card copies. Use when creating a new project, when the user asks to connect, link, register or sync a project with the Hub, pastes a "Copy agent prompt" or an install prompt with `create --local`, or after changing a project's PRD, plans, design or tasks.
---

# yraverage Hub link

The Hub is Enrico's command center. This skill talks to it over its MCP endpoint (`<hub>/api/mcp`) through one script, `hub.mjs` (Node standard library only). The script lives at `~/.yraverage/hub.mjs` once installed; next to this file otherwise.

Sibling skills in this plugin:

- `hub-board`: work cards on the board, checkpoints, guardrail checks, QA runs and defects.
- `hub-build`: the Simple mode `/build` path (17 steps, human gates, the prompt for each step).
- `hub-studio`: the Design Studio (`/studio`): foundations, pages, revisions, export, and the Setup CLI that lets any coding agent build pages.
- `hub-chat`: Hub chat sessions (`/workspace`): connecting a model, the Build, Studio and Manage tabs, and the tools a chat turn gets.

## First time on a machine

1. Install the script: `node <hub repo>/plugins/yraverage-hub/skills/yraverage-hub/hub.mjs install`. It copies the script to `~/.yraverage/hub.mjs` (the commit hooks call that copy) and the `/continue` command to `~/.claude/commands`.
2. Connect from the Hub. Enrico presses **Copy agent prompt** on the Command Center and pastes it into the agent. The agent runs the `enrol` line in it once. From then on `link`, `sync`, `status` and `call` on this machine use that agent's key, with no browser step. Never print the key.
3. Do not run `login` on your own. It opens a browser sign-in that your shell may kill before Enrico approves. If a command says "Not connected", ask Enrico for the copied agent prompt.
4. Another Hub: add `--hub https://hub.example`. A headless machine can also set `YRAVERAGE_HUB_KEY` to an agent key from the Hub's Agents page.

## Starting a new project

Never scaffold a new project by hand. Start from a template:

1. `node ~/.yraverage/hub.mjs templates` lists what the Hub offers: `hub-web` (default for web apps and services: Next.js 15, React 19, TypeScript, Drizzle on PGlite, Vitest, Playwright, audit trail, mint design tokens, PRD and agent docs), `starter-monorepo` and `starter-tanstack`.
2. `node ~/.yraverage/hub.mjs new hub-web <project-folder> --title "<Human title>"` writes the template into an empty folder, makes the first commit, and links it.
3. `cd` into it, run `npm install` and `npm run check`, then fill in `.claude/prds/<name>.prd.md` with the owner before writing features.
4. Read the new project's `AGENTS.md` and `CLAUDE.md` and follow them; they carry the standards (service layer, audit in the same transaction, observable acceptance criteria, session traces).

### The install prompt from a template card

On `/templates/codebases` (also the `template` step of `/build`), **Use template** opens an install prompt with a one-time token. When Enrico pastes it, run the line as given:

`node ~/.yraverage/hub.mjs create --local --template <id> --token <token> --api-url <hub> [--dir <folder>]`

- No sign-in is needed: the token is the credential. It works once and expires after 24 hours; Enrico can revoke it in the same dialog. A used or expired token is refused; ask for a fresh prompt.
- Files land in `--dir` (default the current folder) when it is empty or missing, otherwise in a subfolder named after the template. The script writes `.yraverage/template.json` and makes the first commit.
- The download is what closes the `template` step on `/build`. Run `link` afterwards so the project syncs.

## Linking an existing project

Run `node ~/.yraverage/hub.mjs link` from the project folder (add `--work` for client or employer work). It:

- creates or updates the Hub project for the folder and prints its URL,
- writes `.yraverage/project.json` (ignored by git),
- adds the `yraverage-hub` MCP server to `.mcp.json` (the board tools: claim cards, report progress),
- adds a marked `yraverage Hub` section to `AGENTS.md`,
- installs a `post-commit` hook and Claude Code edit hooks that sync in the background.

Linking twice is safe: the folder path identifies the project, and a folder the Hub already scanned keeps its project.

## Keeping the Hub current

- Commits sync on their own. After editing documents without committing, run `node ~/.yraverage/hub.mjs sync`.
- `node ~/.yraverage/hub.mjs status` shows branch, last commit, documents, cards by status and open questions.
- A failed background sync writes one line to `.yraverage/last-sync.log`. Check it when the Hub looks stale; the usual fix is to paste a fresh "Copy agent prompt" from the Hub.
- `/continue` picks up the project's next card from the board in a new or resumed session.

## What is sent

Git facts (branch, last commit, remote without credentials, change counts), the names of top-level files, `package.json` / `requirements.txt` / `pyproject.toml` / `start*.bat`, and Markdown documents plus `tasks.json` up to four folders deep. Source code is never sent. The Hub decides which documents it keeps (PRD, plans, design, architecture, README, AGENTS.md, CLAUDE.md, tasks). Design documents it keeps (`DESIGN.md`, `docs/design/*`) also count as proof for the `design` and `pages` steps of `/build`.

## Other tools

`node ~/.yraverage/hub.mjs call <tool> '<json>'` calls any Hub MCP tool, for example `call project_status '{"project":"trail"}'`. With an agent key the list also has `design_get` (the Hub's design system: README, tokens.json, components; read it before building a screen), `template_list` and `template_get`.
