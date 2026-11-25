# yravgbuilder

House toolkit for building enterprise and business-ready apps without slop. Built from the Solvarium app (feature standard, Rust x JS method, Tauri desktop), the yravg UI catalogue (B1) and the tastestack design plugin.

## Start here

Type `/yravgbuilder-mode` with what you need, for example:

- `/yravgbuilder-mode new app: supplier portal, web + Windows`
- `/yravgbuilder-mode build the Invoices list + detail screen, all states, sample data`
- `/yravgbuilder-mode should the scheduler move to Rust? measure first`

The mode picks a playbook, copies its steps into the task list, and calls the other skills as each step needs them. `/yravgbuilder-help` answers questions about the toolkit without starting work. `/yravgbuilder` loads the core standard and gate on its own.

## What is inside

| Skill | Purpose |
|---|---|
| yravgbuilder-mode | The manager. Non-negotiables, 10 principles, autonomy limits, delegate agent, 10 playbooks. |
| yravgbuilder | Core: default stack, reference code, tastestack bridge, QA gate. |
| yravgbuilder-ui | Screen standard: catalogue reuse, tokens, states, icons, a11y, enterprise patterns, slop checklist. |
| yravgbuilder-feature | Feature delivery: contract-first core, failing test, CI wiring, canvas first, samples, how-to, changelog. |
| yravgbuilder-rust | What moves to Rust, port-ready JS, card scheme, workspace template (was `rust-mixed`). |
| yravgbuilder-rust-port | Golden-first port and the Rust gate (was `rust-mixed-port`). |
| yravgbuilder-rust-ship | WASM door with JS fallback, CI/Docker, Tauri desktop, updater (was `rust-mixed-ship`). |
| yravgbuilder-help | How to use the toolkit. |

Agent: `yravgbuilder-agent`, the delegate for bounded work (one screen, one module, one Rust area, independent checks).

Playbooks: new app, build screen, feature delivery, canvas first, design review, Rust decision, Rust port, ship desktop, investigation, session pickup.

## Works with

- **tastestack** (`tastestack@yra-skills-public`): slop scan, contrast, impeccable critique. Install it too; without it the mode falls back to the read-only slop checklist and says so.
- **spec-to-canvas**: capture, chrome slicing and board rendering for the Canvas first playbook. **canvas-to-app**: builds the finished canvas into the app.
- yravg catalogue CLI: `npx -y https://uiux.yraveragehub.io/cli/yravg-ui-0.2.0.tgz`.

## Install

```
/plugin marketplace add yravg/yra-skills-public
/plugin install yravgbuilder@yra-skills-public
```

Local test: `claude --plugin-dir ./yravgbuilder` from a checkout of this repo.

After install, remove the standalone `rust-mixed`, `rust-mixed-port` and `rust-mixed-ship` from `~/.claude/skills` so one copy answers.

## Notes

- A repo's own CLAUDE.md, AGENTS.md and owner decisions outrank this plugin.
- MIT, Copyright (c) 2026 yravg.
