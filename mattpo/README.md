# mattpo

Pinned engineering skills from [mattpocock/skills](https://github.com/mattpocock/skills), with a yravg manager. The snapshot in this plugin is commit `abeeaf95660ba9e8b7c753eb38f441ca707a8823` (19 November 2026). This is not Matt Pocock's plugin and it is not an endorsement.

Upstream plugin version at that commit: `mattpocock-skills` 1.3.2, MIT, Copyright (c) 2026 Matt Pocock. The license file is `vendor/LICENSE`. `skills/pr/CREDITS.md` keeps the Humanlayer / Dex Horthy credit from upstream. Glue in this folder (the mode, the core skill, the help skill, the sync skill, the agent, and `scripts/`) is MIT, Copyright (c) 2026 yravg. The vendored snapshot stays MIT, Copyright (c) 2026 Matt Pocock, with credits in `vendor/LICENSE` and `skills/pr/CREDITS.md`.

## Start here

In Claude Code the command is `/mattpo:mattpo-mode`, then the outcome. Example:

`/mattpo:mattpo-mode Members save one notification preference, reload, and see that value. Ask me only what the repo cannot answer. Do not commit.`

`/mattpo-mode` is the same skill when no other command uses that bare name. It is not a second command. `/mattpo:mattpo-help` explains the toolkit and does not start work. `/mattpo:mattpo` loads the core rules. `/mattpo:mattpo-sync` checks for a newer upstream commit and does not apply it until you say so.

Claude Desktop has an open report that installed plugin skills can be namespaced by an install hash instead of the plugin name (anthropics/claude-code issue 86627, last updated 28 August 2026). This README does not claim that desktop path was tested.

## What is inside

| Skill | Purpose |
|---|---|
| mattpo-mode | Manager. Ten principles, twelve playbooks, one delegate. Version 0.1.1 adds a read-only docs-health pass. |
| mattpo | Glossary, domain model, and standards stay apart. Evidence and permissions. |
| mattpo-help | How to start. Does not do the task. |
| mattpo-sync | Read-only upstream check. Apply is a separate confirmation. |
| 26 exposed upstream skills | Generated from the snapshot. A yravg header, then the verbatim skill. |
| ask-matt | In `vendor/` only. The mode is the router. |

Agent: `mattpo:mattpo-agent`.

Playbooks: investigation, session pickup, clarify, spec and tickets, implement, review, PR draft, retro, docs health, architecture, teach, upstream sync.

Docs health inventories the glossary, domain model, architecture notes, ADRs, AGENTS or CLAUDE instructions, and standards, then proposes one canonical file per subject. It does not edit those files until you accept a hunk for that repo. It does not claim a measured token saving. Example: `/mattpo:mattpo-mode Inventory the glossary, domain model, architecture notes, ADRs, and standards. Propose one canonical file per subject. Do not edit them yet.`

The mode writes a file you asked to change. It does not publish issues, commit, merge, deploy, send, install hooks, or apply a snapshot unless you ask for that action.

## Install

This repo's marketplace lists the plugin. It is not turned on by `setup.mjs`.

```
/plugin marketplace add yravg/yra-skills-public
/plugin install mattpo@yra-skills-public
```

Do not also install `mattpocock-skills` from the official marketplace. That copy updates itself and duplicates these skills.

`/mattpo:tdd` and `/mattpo:teach` are the copies here. pstack ships skills with those same bare names. Use the prefix.

A local process check, not a Claude session, is:

```
node scripts/test-sync.mjs
node scripts/test-snapshot.mjs
node scripts/test-installers.mjs
python3 -I ../yra-extras/skills/yra-sk-likepstack/scripts/check_plugin.py .
```

Run those from this directory, except `check_plugin.py`, which takes the plugin directory as its argument.

## Update

`/mattpo:mattpo-sync` runs `node scripts/sync.mjs`. Exit 0 means the lock matches upstream. Exit 1 means an update or a refusal. Exit 2 means the network or the payload check failed and the snapshot was left in place. Apply with `node scripts/sync.mjs --apply` only after you agree. A license change, or a skill path that was added, removed, or renamed, is refused until `coverage.json` and `COVERAGE.md` are updated. OWN skills are never overwritten. The script does not run upstream files. There is no SessionStart hook.

Offline, the pinned skills still load. A failed check does not replace them.

## Counts

27 published upstream skills are mapped. 26 are exposed. `ask-matt` is vendor-only. 12 unpublished upstream skills are listed in `COVERAGE.md` and are not copied.

## Zip

A release zip of this folder has `.claude-plugin/plugin.json` at the zip root. See the artifact checksum next to the pull request. Installing the zip was not part of the automated tests.
