---
name: captureall-reanimate
description: Rebuild captured UI so it looks and moves 100% like the target - same DOM, CSS, timings, easing, state machine, demo data and stage sizing - as readable components in the user's own codebase, then prove it with captureall-match. Ports verbatim when the licence allows, otherwise reimplements from observed behaviour to the same measured result. Use after captureall-grab or a motion capture, when the user wants a component, screen or animation "exactly like" a target site or app, or wants a clone template made from it.
---

# Captureall reanimate

References in `references/`: `port-brief.md` (brief for port agents), `pitfalls.md` (what broke on the affectui.com port and how it was fixed). Script in `scripts/`: `stage_rules.py` (pull a demo's stage-sizing rules out of its CSS). Proven on 101 affectUI items (components, screens, blocks, illustrations, motion), 2026-10.

## Two modes, chosen by licence

- **Verbatim port** (free/open, own, or a recorded licence that allows reuse): copy CSS text, DOM, class names, ARIA, timings, easing, state machine, keyboard handling and demo strings exactly; rename minified identifiers to readable names; replace site helpers with local state. If an open-source copy of the component is already vendored and the chunk's component is byte-identical (compare CSS text after normalising CRLF and `\uXXXX`), re-export the vendored file and port only the demo around it.
- **Observed rebuild** (Pro/gated/unknown): write your own code from the captured preview, description, screenshots, `animations()` keyframes and a measured timeline (`captureall-match`). The target is the same measured result, not the same source. Never paste their code, CSS or markup.

## Steps

1. Inputs ready: `plan.json` and `pretty/<item>/` from `captureall-grab` (verbatim) or a motion capture plus timeline (observed).
2. Decide the clone's file convention first (one file per item and template, an exported `Demo`, a usage snippet and docs file). Build one item yourself as the reference port and get it through the clone's build and a match check before delegating.
3. Shared pieces first: modules several items import (app shells, icons, buttons, charts) go to one shared folder with a map of original export name to readable name, ported by one agent before the item agents start.
4. Delegate items in batches of 4-6 per agent with `references/port-brief.md` filled in. Each agent keeps a checkpoint and runs the clone's single-item build.
5. After the ports: run `scripts/stage_rules.py` over every item's demo CSS and add the `.stage …` rules (see pitfalls) unless the agents already kept them.
6. Full build, then `captureall-match` on every item: text fingerprint sweep, then timelines for animated items at the same stage width.
7. Fix every mismatch at its root cause; re-match until all items pass or each remaining difference is explained by evidence (tick phase, random seed).

## Rules that keep it 100%

- Same stage, same width. Container queries and media queries change what is visible; the preview must give the component the target stage's inner width and the same stage wrapper rules.
- Screens on the target are a fixed canvas scaled to fit (affectUI: 1440 x 900, `transform: scale(width/1440)`): use one shared stage component, not a full-viewport box.
- Timers: keep the exact intervals, delays and loop length; keep `performance.now()` clocks and `key={round}` restarts as the original has them.
- Reduced motion: where the original reads `prefers-reduced-motion` in JS, use the clone's reduced-motion hook; next to each `@media (prefers-reduced-motion: reduce)` rule add the same rule under the clone's manual switch (yravg UI: `:where([data-reduce="1"]) `).
- Absolute asset URLs stay pointed at the target only when the licence allows; otherwise use own assets of the same size.
- Comments only for why; no dead code from the minified source.

## Done means

Every item builds, its fingerprint matches the target at the same width, animated items have the same state sequence and timings within sampling jitter (about ±100 ms at 50 ms sampling), no console errors, and the handoff lists any accepted difference with its evidence.
