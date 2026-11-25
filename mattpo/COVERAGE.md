# Coverage

Machine-readable source: `coverage.json`. `scripts/sync.mjs` refuses an apply when this file does not mention a published or unpublished path, and when the upstream `plugin.json` skill list is not the same set as `published`.

Pin checked at build: `abeeaf95660ba9e8b7c753eb38f441ca707a8823`. Counts: 27 published, 26 exposed, 1 vendor-only, 12 unpublished and not copied.

This is not an endorsement by Matt Pocock. The upstream repo license is MIT, Copyright (c) 2026 Matt Pocock. `skills/engineering/pr/CREDITS.md` stays with the `pr` skill.

## Published

| Path | Disposition | Why |
|---|---|---|
| `skills/engineering/ask-matt` | vendor-only | Second router. `mattpo-mode` is the manager. |
| `skills/engineering/code-review` | expose | Pins a diff base. Standards and spec stay separate. |
| `skills/engineering/codebase-design` | expose | Deep-module vocabulary. |
| `skills/engineering/diagnosing-bugs` | expose | Feedback loop, then a regression test. |
| `skills/engineering/domain-modeling` | expose-held | Glossary and ADRs. Write them when the user asks. |
| `skills/engineering/grill-with-docs` | expose-held | Interview plus domain notes. One question, then wait. |
| `skills/engineering/implement` | expose-held | Builds the change. Commit stays explicit. |
| `skills/engineering/implement-spec` | expose-held | Task graph. Worktrees, merge, and PR stay explicit. |
| `skills/engineering/improve-codebase-architecture` | expose-held | Hotspot report. The user picks. No scheduled refactor. |
| `skills/engineering/pr` | expose-held | Pull request body, including the Humanlayer credit. Opening it stays explicit. |
| `skills/engineering/prototype` | expose-held | Throwaway prototype in a scratch directory. |
| `skills/engineering/research` | expose-held | Cited notes in the reply or a named path. |
| `skills/engineering/retro` | expose-held | One proposed check. It is not applied here. |
| `skills/engineering/setup-matt-pocock-skills` | expose-held | Tracker setup draft. Not run just because the plugin is installed. |
| `skills/engineering/tdd` | expose | Red-green-refactor. Bare `/tdd` also belongs to pstack. |
| `skills/engineering/to-spec` | expose-held | Spec draft. Tracker publish stays explicit. |
| `skills/engineering/to-tickets` | expose-held | Vertical slices and blockers. Tracker publish stays explicit. |
| `skills/engineering/triage` | expose-held | Triage draft. Label and close actions stay explicit. |
| `skills/engineering/wayfinder` | expose-held | Multi-session map. Tracker publish stays explicit. |
| `skills/engineering/wizard` | expose-held | Shows a bash wizard. Does not run it. |
| `skills/productivity/grill-me` | expose | Interview with no document writes of its own. |
| `skills/productivity/grilling` | expose-held | One consequential question, then wait. |
| `skills/productivity/handoff` | expose | Context packet for a later session. |
| `skills/productivity/teach` | expose | Explanation when asked. Bare `/teach` also belongs to pstack. |
| `skills/productivity/to-questionnaire` | expose-held | Draft only. Sending stays explicit. |
| `skills/productivity/wait-what` | expose | Re-explain the last message. |
| `skills/productivity/writing-for-agents` | expose-held | Steering-file edits only when that file was requested. |

## Unpublished

Present in the upstream git tree at the pin. Omitted from upstream `plugin.json`. Not copied into `vendor/`.

| Path | Why |
|---|---|
| `skills/in-progress/chief-of-staff` | Unpublished long-running coordinator. |
| `skills/in-progress/claude-handoff` | Unpublished. Starts a background agent. |
| `skills/in-progress/loop-me` | Unpublished. |
| `skills/in-progress/setup-ts-deep-modules` | Unpublished. Wires dependency-cruiser. |
| `skills/in-progress/software-factory` | Unpublished factory vocabulary. |
| `skills/in-progress/writing-beats` | Unpublished writing skill. |
| `skills/in-progress/writing-fragments` | Unpublished writing skill. |
| `skills/in-progress/writing-shape` | Unpublished writing skill. |
| `skills/misc/git-guardrails-claude-code` | Frozen. Installs git hooks. |
| `skills/misc/migrate-to-shoehorn` | Frozen test-assertion migration. |
| `skills/misc/scaffold-exercises` | Frozen course scaffold. |
| `skills/misc/setup-pre-commit` | Frozen. Installs Husky hooks. |

An update that adds, removes, or renames a published path is refused until this file and `coverage.json` both change.
