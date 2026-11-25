# Changelog

## Unreleased

## 0.1.1 - 2026-11-08
- tastestack root found by listing ~/.claude/plugins/cache/yra-skills-public/tastestack/<version>/ (a recursive Glob timed out in the install test).
- Point the bridge at the renamed tastestack plugin (was taste-stack): skill names `tastestack:*`, agent `tastestack:tastestack-agent`, script lookup under ~/.claude/plugins, with the tastestack directory in a yra-skills-public checkout as the fallback. Scan and contrast scripts run-checked.

## 0.1.0 - 2026-11-08
- First release: yravgbuilder-mode (10 principles, 10 playbooks), core standard and QA gate, UI and feature leaves, Rust leaves moved from the standalone rust-mixed skills, help skill, delegate agent.
- Tested: UI build task without the plugin (baseline) vs with it, two runs including a "skip the states" pressure run.
