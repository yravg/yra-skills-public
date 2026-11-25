---
name: yravgbuilder-help
description: 'Explains the yravgbuilder plugin: how to start a task with /yravgbuilder-mode, which skill or playbook fits a situation, and how to word a request. Used for /yravgbuilder-help or questions about how to use the app-building toolkit.'
disable-model-invocation: true
---

# yravgbuilder help

Answer the user's question about the toolkit and hand them a request they can send. Do not start the work for a help question. If the message actually asks for work ("build the invoices screen"), read `../yravgbuilder-mode/SKILL.md` and do it under that mode instead.

## Starting a task
Type `/yravgbuilder-mode` followed by the goal and how to tell it is done. The mode picks a playbook, copies its steps into the task list, calls the skills, and pauses only for its Always-pause list (global tokens, removing controls, new dependencies, Rust as default, publishing).

- `/yravgbuilder-mode new app: supplier portal, web + Windows, roles buyer/approver`
- `/yravgbuilder-mode build the Invoices list + detail screen, B1, all states, sample data`
- `/yravgbuilder-mode deliver PRD row FIN-012 aging buckets`
- `/yravgbuilder-mode review the Settings page, fix P0-P2, before and after`
- `/yravgbuilder-mode should the scheduler move to Rust? measure first`
- `/yravgbuilder-mode port the CPM forward pass to Rust, golden-equal`

## Which playbook
| Situation | Playbook |
|---|---|
| Start a new app | New app |
| One new screen | Build screen |
| One PRD row end to end | Feature delivery |
| Big feature, redesign, parity port | Canvas first |
| Audit an existing screen | Design review |
| "Should this be Rust?" | Rust decision |
| Port one function to Rust | Rust port |
| Windows / macOS app | Ship desktop |
| A question, no file change | Investigation |
| Continue earlier work | Session pickup |

## Which skill on its own
- Stack, reference code, gate: `/yravgbuilder`
- Screen standard and slop checklist: `/yravgbuilder-ui`
- Feature contract, tests, samples, release notes: `/yravgbuilder-feature`
- Rust decision and workspace: `/yravgbuilder-rust`; port: `/yravgbuilder-rust-port`; WASM and desktop: `/yravgbuilder-rust-ship`
- Scan, contrast, critique: the tastestack plugin (`/tastestack-mode` for design-only work)

Single skills are fine for a quick look-up; use `/yravgbuilder-mode` for anything that changes a file.

## Common problems
- "Slop scan skipped": tastestack is not installed. Install `tastestack@yra-skills-public`, or accept the read-only checklist.
- "Catalogue CLI fails": run it with `npx -y` and network on, or read `src/own` in the yravg UI catalogue directly.
- "Rust gate SKIP": cargo is not on PATH. A SKIP is not a pass for a Rust change; install the pinned toolchain.
- Two copies answer for Rust: remove the standalone `rust-mixed*` skills from `~/.claude/skills` after installing this plugin.
