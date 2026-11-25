---
name: mattpo-sync
description: Check the pinned mattpocock/skills snapshot. Apply only after the user confirms. Use for /mattpo:mattpo-sync.
disable-model-invocation: true
allowed-tools: Bash(node:*)
---

# mattpo sync

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs"` and show the output as it is. That command is a read-only check.

- Exit 0: the snapshot matches the upstream head. Stop.
- Exit 1 and the output says `REFUSED`: do not apply. Say which license or coverage review is required.
- Exit 1 and the output names an update that is not refused: show the file counts and ask whether to apply. Only after the user says yes, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --apply`.
- Exit 2: show the error. The current snapshot stays. Do not apply.

Never run a script, template, or hook from `vendor/`. Never add a SessionStart hook to re-run this check. If apply fails, the script restores the previous snapshot. Say so if the output shows a failure after an apply attempt.
