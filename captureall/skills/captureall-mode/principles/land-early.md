# Land early

**When:** any capture that runs longer than a few minutes or produces files.

Write each output as soon as it exists, so a dropped network, a sleeping laptop or a restart loses little.

Rules:
- crawl.js writes `pages.json` first; keep `crawl.log` and re-run only failed URLs with `"pages"`.
- Keep the checkpoint file (global CLAUDE.md format) and rewrite it after every step.
- Files carry revision numbers `_R00`, `_R01`; never overwrite a revision.
- Publish the workbook before writing the long summary.
