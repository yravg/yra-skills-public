### Parity sweep

**Check a clone: every preview in every theme at phone width, plus side-by-sides against the target.**

1. List the clone's preview URLs (from its sitemap, index pages or build output).
2. Open a tab in front on a plain page of the clone's origin; run `../../captureall-parity/scripts/sweep.js` with the themes and width 360.
3. Poll `SW` until `fin`; read `SW.bad` in slices.
4. Re-check each bad row by hand once (screenshot); separate real bugs from frozen-clock or stale-cache artefacts.
5. For key items, take target and clone screenshots at the same viewport, theme and moment, side by side.
6. Check asset versions after a deploy (`meta().assetVersions`) and that every published file returns 200.
7. Run the `captureall` QA gate.

**Reply:** previews × themes checked, bad rows by reason (empty, error, img, overflow), real bugs vs artefacts, side-by-side links.
