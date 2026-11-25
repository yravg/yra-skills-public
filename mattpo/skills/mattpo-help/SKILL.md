---
name: mattpo-help
description: Explains the mattpo plugin and hands back a request the user can send. Does not start the work. Use for /mattpo:mattpo-help.
disable-model-invocation: true
---

# mattpo help

Answer the question about this toolkit. Do not start the engineering work. If the message is the work itself, read `../mattpo-mode/SKILL.md` and run that mode instead.

## Start

Type `/mattpo:mattpo-mode` and the outcome. `/mattpo-mode` reaches the same skill only when no other command already uses that bare name. It is not a second command.

`/mattpo:mattpo` loads the core rules without picking a playbook. `/mattpo:mattpo-sync` checks the pinned upstream and does not apply it.

Example:

`/mattpo:mattpo-mode Members save one notification preference, reload, and see that value. Ask me only what the repo cannot answer. Do not commit.`

Docs cleanup, still a proposal until you accept a hunk:

`/mattpo:mattpo-mode Inventory the glossary, domain model, architecture notes, ADRs, and standards. Propose one canonical file per subject. Do not edit them yet.`

The mode reads the repo, asks at most the one decision that blocks the slice, then drafts a spec and vertical slices. After you accept them, a later `/mattpo:mattpo-mode implement the accepted preference slice` builds it and reviews spec and standards separately. Commit, publish, and deploy stay off until you ask.

## Which playbook

| Situation | Playbook |
|---|---|
| A read-only question | Investigation |
| Continue earlier work | Session pickup |
| Sharpen a plan | Clarify |
| Save a spec and slices | Spec and tickets |
| Build an accepted slice | Implement |
| Review a diff | Review |
| Write a pull request body | PR draft |
| After a session | Retro |
| Clean glossary, architecture, ADR, or standards docs | Docs health |
| Look for one structural problem in code | Architecture |
| Explain a term or a decision | Teach |
| See if the pinned skills moved | Upstream sync |

## Names that collide

`/mattpo:tdd` and `/mattpo:teach` are the skills in this plugin. pstack also ships `tdd` and `teach`. Use the `mattpo:` prefix. Do not install `mattpocock-skills` from the official marketplace beside this plugin.

## What this plugin will not do on its own

It will not publish issues, commit, merge, deploy, send mail, install a hook, or apply an upstream snapshot. It will not rewrite a product repo's docs because someone asked to change this plugin. It will write a file you asked for, after you accept a docs-cleanup hunk.
