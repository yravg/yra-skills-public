### Reanimate

**Rebuild a target's UI and motion in the user's codebase so it looks and moves 100% the same, and prove it.**

1. List the items (target URL, clone path, clone preview URL) and classify each one's licence (`../principles/licence-before-code.md`); pick verbatim port or observed rebuild per item.
2. Grab: read `../../captureall-grab/SKILL.md`; map the registry, download and pretty-print each item's demo chunks and CSS into the scratchpad (verbatim items), or run the motion-capture playbook (observed items).
3. Port one reference item yourself through the clone's build and a match check (`../../captureall-match/SKILL.md`).
4. Port shared modules (one agent), then items in batches of 4-6 per `captureall-agent` with `../../captureall-reanimate/references/port-brief.md`; every agent keeps a checkpoint.
5. Add stage rules (`captureall-reanimate/scripts/stage_rules.py`), screen stage, reduced-motion twins; full build.
6. Match every item: fingerprint sweep on both origins, then timelines for animated or differing items at the same stage width (`../principles/same-width-same-moment.md`).
7. Fix each real gap at its root cause and re-match; record accepted differences (tick phase, random seed) with evidence in the handoff.
8. Run the `captureall` QA gate; commit only the clone files this run changed.

**Reply:** items ported (verbatim / observed), match counts (equal / close / different), timeline results for animated items, accepted differences with evidence, clone link to check.
