---
name: tastestack-sync
description: Checks the three upstreams (impeccable, tastemaker, stageshow) for updates and, after the owner agrees, applies them with scripts/sync.mjs. Refuses a changed or missing licence file. Use for /taste-sync, "update the design toolkits", or "is there a newer impeccable".
---

# Tastestack sync

Keeps `vendor/` and the generated skills current. The script only copies files; it never runs upstream code.

## Check

`node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --check`

- Exit 0: all up to date. Say so and stop.
- Exit 1: updates exist. List them and ask the owner whether to apply.
- Exit 2: error (usually `gh` not logged in, or no network). Show it and stop.

## Apply (only after the owner says yes)

`node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --apply`

- Show the file counts it prints.
- It rewrites `vendor/`, the generated skills, `upstream.lock.json` and `UPSTREAM.md`.
- It never deletes or overwrites the own skills: `tastestack`, `tastestack-mode`, `tastestack-help`, `tastestack-sync`. A new own skill must be added to `OWN` in `scripts/sync.mjs`; `scripts/test-sync.mjs` covers the list.
- It aborts if two skills would get the same name.

## Licence refusal

If the output says `REFUSED` for a licence file, an upstream licence changed or vanished. Do not work around it. Name the file, tell the owner, and leave the lock alone. The owner reads the new licence and updates the lock by hand.

## After an apply

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/test-sync.mjs"` passes.
2. The four own skills are still in `skills/`.
3. Skim `UPSTREAM.md` for new or renamed skills and tell the owner.
