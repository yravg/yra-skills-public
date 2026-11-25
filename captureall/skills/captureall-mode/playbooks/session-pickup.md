### Session pickup

**Resume earlier capture work from its checkpoint, handoff or outputs without starting over.**

1. Find the checkpoint (`.checkpoints/<agent>.md`), the handoff (`docs/handoff/<slug>.md`) or the last capture folder.
2. Revert any `unreverted change`, trust the `done` lines, start from `next`.
3. For a crawl: compare `pages.json` with `captures.json`; re-run only missing or failed URLs.
4. Re-check that the target has not changed since (one page, `meta()` and a screenshot).
5. Continue the matching playbook from its next step.
6. Run the `captureall` QA gate.

**Reply:** what was already done, what this session did, current state, next step.
