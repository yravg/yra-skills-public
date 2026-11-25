### Site crawl

**Capture every page of a site or section in every variant, with code where public, into a workbook and packs.**

1. Probe one index page and one detail page by hand (engine.js in a tab): preview selector, how theme/style/viewport are stored, whether a Code tab exists, link prefixes per section, the IA (`ia()` groups and counts).
2. Write the crawl config (`../../captureall-web/SKILL.md` shows the fields and an example) with sections, variants, viewports, states, `pageData: true`.
3. Count pages × variants. Above 2000 captures, pause and ask.
4. Set up Playwright in a scratch folder if missing, then run `node crawl.js cfg.json > crawl.log 2>&1` in the background.
5. Watch `crawl.log`; when done, re-run failed URLs from `errors.json` with `"pages"`.
6. Check variants really differ (root attributes or tokens per variant in a few captures).
7. Build outputs with the `captureall-pack` skill (workbook + packs).
8. Spot-check: one GIF, one Code row, one IA row against the live sidebar counts.
9. Run the `captureall` QA gate.

**Reply:** pages × variants = captures, errors, code-available count, IA group counts, file links, licence split (free vs gated items).
