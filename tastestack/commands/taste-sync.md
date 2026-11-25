---
description: Check the tastestack upstreams (impeccable, tastemaker, stageshow) for updates and, after you confirm, apply them.
allowed-tools: Bash(node:*)
---

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --check` and show the output as it is.

- Exit code 0: say everything is up to date and stop.
- Exit code 1: list which upstreams have updates and ask me whether to apply them. Only after I say yes, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/sync.mjs" --apply` and show the file counts it prints. If it says REFUSED for a licence change, do not work around it; tell me which file changed so I can read it.
- Exit code 2: show the error (usually `gh` not logged in or no network) and stop.

Never run any script from `vendor/` or from the downloaded files.
