### Investigation

**Answer a read-only question about a target or an earlier capture, with evidence and no new files.**

1. Restate the question and what would answer it (a page, an element, a count, a token).
2. If an earlier capture exists (workbook, pack, `captures.json`), answer from it first and give its timestamp.
3. Otherwise open the page in a tab in front and inject `../../captureall-web/scripts/engine.js`; read only what the question needs (`meta()`, `ia()`, `tokens()`, `capture(sel)`).
4. Screenshot the evidence when the answer is visual.
5. Run the `captureall` QA gate items that apply (evidence, licence class).

**Reply:** the answer first, then the evidence (URL, selector, value, screenshot), then what was not checked.
