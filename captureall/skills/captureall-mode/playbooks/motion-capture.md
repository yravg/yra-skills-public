### Motion capture

**Record how a target moves: keyframes, transitions, timelines, frames and reduced-motion behaviour.**

1. Pick the element(s) and the trigger (load, hover, click, scroll, replay button).
2. In a tab in front (or headless crawl.js with `frameTimes`), inject engine.js and reset the animation (reload or the page's replay control).
3. Sample `__robo.animSnapshot(el)` at 100, 400, 900, 1600, 2600, 4200 ms and take a screenshot or element frame each time.
4. Capture `__robo.animations(el)` for keyframes, durations, delays, easings and stagger.
5. Repeat with reduced motion (crawl variant `reducedMotion: "reduce"`, or `a11y().reducedMotionRules`) and record what changes.
6. If a frame is empty, check for a frozen clock (`../principles/clock-in-front.md`) before calling it a bug.
7. Build a GIF per variant (crawl.js + build_outputs.py do this) or list frames in order.
8. Run the `captureall` QA gate.

**Reply:** each animation (name, target, duration, easing, delay, iterations), the timeline, reduced-motion behaviour, frame or GIF links.
