# tastestack

Design-quality toolkit for Claude Code. A manager mode (`/tastestack-mode`) routes every design task to a playbook and to three vendored, auto-synced upstreams. Built from a week of canvas audits and fixes.

## Start here

Type `/tastestack-mode` with what you need:

- `/tastestack-mode audit the Settings boards, fix P0-P2, give before and after scores`
- `/tastestack-mode build the onboarding screen from this brief, tokens only`
- `/tastestack-mode is there a newer impeccable?`

The mode picks a playbook, copies its steps into the task list and calls the other skills. `/tastestack-help` answers questions without starting work.

## What is inside

| Skill | Purpose |
|---|---|
| tastestack-mode | The manager. Non-negotiables, 10 principles, autonomy limits, delegate agent, 9 playbooks. |
| tastestack | Core facts: which tool for what, scan and contrast commands, the QA gate. |
| tastestack-sync | Check and apply upstream updates; refuses licence changes. |
| tastestack-help | How to use the toolkit. |
| impeccable, stageshow, tastemaker, tastemaker-* | Generated from the upstreams. Do not edit. |

Agent: `tastestack-agent`, the delegate for bounded work (audit one board group, fix one screen, independent checks).

| Upstream | Use it for | Licence |
|---|---|---|
| [impeccable](https://github.com/pbakaus/impeccable) (pbakaus) | critique, polish, audit vocabulary | Apache-2.0 |
| [tastemaker](https://github.com/Harrypatria/tastemaker) (Harrypatria) | taste contract, slop scan, tokens, components | MIT |
| [stageshow](https://github.com/benjitaylor/skills/tree/main/stageshow) (Benji Taylor) | faux product UI and demo animation | MIT |

Principles: tokens not raw values, never invent data, measure don't eyeball, read the rules when a CLI is blocked, every state exists, diff don't rewrite, one tool per job, fan out by file ownership, licences stay with assets, a report states what was not viewed.

Playbooks: design review, canvas board pass, build new screen, product mock, brand assets, tokens and theme, upstream sync, investigation, session pickup.

## Install

```
/plugin marketplace add yravg/yra-skills-public
/plugin install tastestack@yra-plugins
```

## Sync

`/taste-sync` (or `/tastestack-sync`) checks the three upstreams, shows what is newer and asks before applying. Or from a shell:

```
node scripts/sync.mjs --check    # report only; exit 1 when updates exist
node scripts/sync.mjs --apply    # download, replace vendor/, regenerate skills/, rewrite upstream.lock.json
```

It needs `gh` (logged in) and `git`. It only copies files and never runs upstream code. It refuses an update when an upstream licence file changed or vanished, and aborts if two skills would get the same name. A SessionStart hook runs `--check` at most once a day, prints one line when updates exist, and never blocks or fails the session.

Tests (no network): `node scripts/test-sync.mjs`.

## Layout

- `vendor/<upstream>/` verbatim upstream files with their LICENSE and NOTICE. Do not edit.
- `skills/` generated copies in the shape Claude Code needs (`impeccable`, `stageshow`, `tastemaker`, `tastemaker-*`) plus our own skills (`tastestack`, `tastestack-mode`, `tastestack-help`, `tastestack-sync`), which `sync.mjs` never deletes or overwrites (the `OWN` list). Only the `name:` line of renamed tastemaker skills differs; see [UPSTREAM.md](UPSTREAM.md).
- `upstream.lock.json` repo, tracked paths, ref, synced commit, time, licence.
- `commands/taste-sync.md`, `hooks/hooks.json`, `scripts/`.

## Optional: tastemaker's own scan hook

Tastemaker ships a PostToolUse hook that runs its slop scanner after every Write or Edit (`vendor/tastemaker/hooks/hooks.json`). It is not enabled here. To use it, copy that hook into your own settings with the script path `${CLAUDE_PLUGIN_ROOT}/skills/tastemaker-guard/scripts/slop-scan.mjs`.

## Not exposed

Tastemaker's slash commands (`commands/`) and `taste-critic` agent are vendored but not registered; the skills cover the same ground. Impeccable's CLI under `vendor/impeccable/scripts/` is never run by this plugin.

## Licences and attribution

Our own glue (mode, core, help and sync skills, agent, sync script, command, hook, docs) is MIT, Copyright (c) 2026 yravg. Everything under `vendor/` and the copies under `skills/` keep their upstream licences: Apache-2.0 (impeccable, see `vendor/impeccable/LICENSE` and `NOTICE.md`) and MIT (tastemaker by Harry, stageshow by Benji Taylor). Upstream copyright notices stay in each LICENSE file.
