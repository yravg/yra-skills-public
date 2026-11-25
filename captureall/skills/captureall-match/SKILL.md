---
name: captureall-match
description: Prove a clone looks and moves the same as its target - text fingerprints of every preview on both origins, state timelines of animated items (what changes, in what order, how many ms apart) at the same stage width, and a compare step that separates real differences from tick phase and sampling jitter. Use after captureall-reanimate, when the user asks "is it 100% the same", "check against the original", or to confirm animations match.
---

# Captureall match

Scripts in `scripts/` (paste their text with `javascript_tool`; they only read the page): `fingerprint.js`, `timeline.js`. Offline compare: `compare.py`. Read `../captureall-mode/principles/same-width-same-moment.md` and `clock-in-front.md` first.

## 1. Pair the items

List `target URL -> clone preview URL` for every item. Map renamed slugs. Note each side's stage selector (affectUI: `.stage__look`, screens `.screen-stage__canvas`, blocks and illustrations `.stage > :first-child`; a clone preview: `#root`).

## 2. Same width

Measure the target stage's inner width at a desktop window (`resize_window` 1440 x 900 on its tab, then read `getBoundingClientRect().width` of the stage selector). Set the clone tab's viewport so its preview root gets the same width (preview padding included). Reset both tabs to `desktop` when done.

## 3. Fingerprint sweep (all items)

Cross-origin iframes usually fail (framing forbidden), so each origin gets its own tab:

1. In the target tab: `javascript_tool` with the text of `scripts/fingerprint.js`. It saves the function in that origin's `localStorage.__fp_fn` and clears `__fp`.
2. `browser_batch`, at most 12 items per batch: `navigate` to the item, then `javascript_tool`: `await new Promise(r=>setTimeout(r,4000)); eval(localStorage.__fp_fn)('<selector>')`. Each call returns and stores `words:bitset` (unique-word count plus a 256-bit word hash set).
3. Read everything at the end: `localStorage.__fp`. Do the same on the clone origin.
4. `python -I scripts/compare.py target.json clone.json` reports equal, close (bit overlap ≥ 0.9) and different items.

Equal fingerprints mean the same text at the same moment, not the same pixels. A difference on an animated item is not yet a bug: go to step 4.

## 4. Timeline (animated or differing items)

1. Both tabs at the same width (step 2), each in front while it samples.
2. Paste `scripts/timeline.js` once per origin (it stores `localStorage.__tl_fn`).
3. Per item and side: `navigate`, then `await eval(localStorage.__tl_fn)('<selector>', 14000)`. It returns `ms=hash:words` at every change, timed from the moment text first appears, sampled every 50 ms.
4. Compare: the same hash sequence with matching times (±100 ms) is the same animation. If only some checkpoints match, look for continuous clocks (`performance.now()` read on a 100 ms tick, elapsed time, cost counters): frames between checkpoints then differ by tick phase only. Prove it by reading the same timer code on both sides.
5. A different hash sequence, a different count of states or a time drift is a real gap: diff the two texts at the first differing state, then fix the port.

## 5. Visual and console

For items whose text matches but which still look wrong: screenshot both sides at the same width and moment (`<item>_target.png`, `<item>_clone.png`). Check the clone's console for errors after a fresh reload; verify a fix in the bundle text, because logs persist and bundles cache.

## Report

Counts: equal / close / different; per remaining difference the evidence (fingerprints, timelines, screenshots) and the cause (width, moment, tick phase, real gap). Save `target.json`, `clone.json` and timelines in the capture folder.
