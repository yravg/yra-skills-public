### Element capture

**Capture one or a few elements on a page, in every variant, as paste-ready web-capture JSON.**

1. Open the page in a tab in front (built-in browser, or Claude in Chrome for signed-in pages after Enrico agrees).
2. Inject `../../captureall-web/scripts/engine.js` with `javascript_tool`.
3. Find the selector: `document.querySelectorAll('<guess>').length`, then confirm with a screenshot.
4. For each variant (theme, style, viewport): set it the way the page stores it, reload, wait ~4.5 s, then `JSON.stringify(__robo.capture(sel, {animations:true}))`. Over 40 KB: stash in `window.__rc_s` and read in 40 000-character slices.
5. Add `__robo.states(sel)` and, for real states, hover/focus the element with the `computer` tool and capture again.
6. Add `__robo.a11y(sel)` and `__robo.meta()` (full description).
7. Classify the licence (`../principles/licence-before-code.md`).
8. Save `capture_<variant>.json` files and one `web-capture.txt` (`__robo.wrap([...])`) in the capture folder.
9. Run the `captureall` QA gate.

**Reply:** element, variants captured, file paths, licence class, states found, what was not captured.
