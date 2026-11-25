### Session pickup

**Resume earlier work from its checkpoints and handoff.**

1. Read the feature handoff (`docs/handoff/<feature>.md`), then its roadmap.
2. Read the newest checkpoint of each agent (`.checkpoints/`). Revert any `unreverted change` it lists.
3. Trust the `done` lines. Check that the files and SHAs they name exist.
4. Re-run the suites of the touched area to confirm the starting state.
5. Continue from `next`. Rewrite the checkpoint and the handoff after each step.

**Reply:** what was done before, what you verified, the exact next step, anything that no longer matches.
