# Pitfalls (affectui.com -> yravg UI port, 2026-10)

Each entry: symptom, cause, fix.

1. **Preview renders nothing, console `X.escape is not a function`.** The module declares `const CSS = \`...\``, which shadows the global `CSS`, so `CSS.escape(...)` calls a string. Fix: `window.CSS.escape` (or rename the constant). Grep every port for module constants named like browser globals.

2. **Words missing or extra versus the target.** The stage widths differed. Container and media queries hide sub-options, counters and arrows at narrow widths. Compare at the target stage's inner width (affectUI desktop stage: 804 px inside a 1440 px window). The browser pane may be narrow, so emulate the viewport.

3. **Demo sits too high, too small or unscaled.** Ports skipped the demo CSS's `.stage <descendant>` rules (top margins, `zoom`, max heights). The clone's preview root has class `stage`, so those rules apply verbatim. Recover them with `scripts/stage_rules.py <demo.css>`. Drop `.stage:has(...)` rules: they style the target's stage box, which the clone does not have.

4. **Screens look like a different layout.** The target shows screens on a 1440 x 900 canvas scaled to the stage width. A full-viewport box lays the screen out responsively at the iframe width instead. Use one shared scaled stage component.

5. **Template shows the wrong demo.** An open-source item's packaged usage example is not the site's demo. The site demo chunk (`demo.clean-*`) wraps the same component in its own demo. Port the demo and re-export the vendored component.

6. **Item "missing" from the clone.** Name collisions: the clone renamed some slugs (`motion-button`, `command-menu-plus`). Map target slug to clone slug before any sweep.

7. **Animated items differ in a fingerprint sweep.** The two samples were taken at different moments. Compare timelines (state sequence plus timings) with the same start rule (first text appears). Frames between checkpoints can still differ when a 100 ms tick reads `performance.now()`: that is tick phase, not a bug, if the checkpoints match.

8. **Cross-origin iframes return nothing.** Target pages often forbid framing. Sweep the target by navigating one tab and storing results in that origin's `localStorage`, and sweep the clone separately.

9. **Console shows an old error after a fix.** Console logs persist across reloads in the pane, and the browser may serve a cached bundle (transfer size about 300 bytes). Check the new bundle text for the fixed call instead of trusting the log.

10. **Executing downloaded code** is blocked by the security classifier and is unsafe. Parse only: regex, literal parser, `esbuild.transform`.

11. **Shared checkout with other sessions.** Stage only your files. Never `git add -A` blindly; exclude other sessions' edits and temp files.

12. **A guard blocks `rm -rf` of scratch build folders.** Leave gitignored scratch folders in place, or delete them with the shell's own remove command where that is allowed. Never retry the blocked command.
