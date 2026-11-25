### Design-system extract

**Turn a target's tokens, fonts and themes into DESIGN.md and tokens.json the user can build on.**

1. Open the target home page and one dense page in a tab in front; inject engine.js.
2. For each theme and skin the target offers: set it, reload, run `__robo.tokens()` and `__robo.fonts()`; save per theme.
3. Sample real usage: `capture()` on a button, card, input, nav item, heading and body text for radius, shadow, spacing, type scale and colour use.
4. Group tokens into colour (surface, line, ink, accent, on-accent, status), type, radius, shadow, spacing, motion (durations, easings from `animations()`).
5. Write `tokens.json` (one object per theme) and `DESIGN.md` (palette table per theme, type scale, radius, motion, fonts with their licence).
6. Check contrast of ink and on-accent against their backgrounds (WCAG AA 4.5:1 for text); flag misses.
7. Classify the licence of fonts and any reused values (`../principles/licence-before-code.md`).
8. Run the `captureall` QA gate.

**Reply:** themes found, token counts per group, fonts and their licences, contrast misses, file links.
