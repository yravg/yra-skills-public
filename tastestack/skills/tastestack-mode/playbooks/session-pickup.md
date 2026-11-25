### Session pickup

**Resume earlier design work from its checkpoints.**

1. Find the checkpoint files (`.checkpoints/` in the project, and the project's handoff).
2. Read the newest checkpoint of each agent. Revert any `unreverted change` it lists.
3. Trust the `done` lines. Check the files they name exist and match.
4. Re-run the scan and the build on the touched files to confirm the starting state.
5. Continue from `next`. Rewrite the checkpoint after each step.

**Reply:** what was done, what you verified, the exact next step, anything that no longer matches.
