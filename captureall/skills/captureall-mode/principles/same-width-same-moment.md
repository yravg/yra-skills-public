# Same width, same moment

**When:** comparing a clone with its target: a fingerprint, a screenshot, a timeline, a "matches" or "differs" claim.

Two renders of the same component differ when the container width or the moment differs. Container and media queries hide or show parts. Animations show different states at different times. Such a difference says nothing about the port.

Rules:
- Measure the target stage's inner width at a desktop window and give the clone's preview root exactly that width (emulate the viewport; the browser pane is often narrower than both).
- Start every timed sample from the same event on both sides (first text in the stage), not from navigation.
- Compare animations as state sequences with timings, not single snapshots; ±100 ms is sampling jitter at 50 ms sampling.
- Before calling the remaining frame-to-frame differences a bug, check for continuous clocks read on a tick (`performance.now()` every 100 ms): those differ by tick phase on every run, even target against itself.
- Reset emulated viewports when done.
