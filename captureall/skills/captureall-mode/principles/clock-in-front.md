# Clock in front

**When:** sampling animations, taking frames, timing anything, or running a sweep in a browser.

Browsers freeze animation clocks and slow timers in hidden or background tabs. A blank hero or a stuck spinner in a background tab is a capture artefact, not a page bug.

Rules:
- Sample motion and run sweeps in a tab that is in front, or headless in Playwright (which runs its own clock).
- If a frame looks empty, check `document.getAnimations()[0].currentTime`; 0 after seconds means a frozen clock.
- Give a long sweep its own tab on a plain page of the target origin (a .txt or licence file) so nothing else competes, and poll a window variable instead of waiting inside one tool call.
- Shared browser pane: every agent works in its own tab; never navigate a tab another agent uses.
- After a deploy, check stylesheet and script URLs carry a fresh version string (`meta().assetVersions`); a stale cached CSS looks like a layout bug.
