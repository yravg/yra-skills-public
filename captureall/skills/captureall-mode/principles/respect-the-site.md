# Respect the site

**When:** crawling, capturing many pages, or meeting a login, paywall or CAPTCHA.

Capture what a normal visitor sees, at a pace a normal visitor would cause.

Rules:
- Concurrency 5 or less; add `settleMs` rather than more workers.
- No login automation, no CAPTCHA solving, no bypass of rate limits or bot checks.
- No hidden endpoints, no source maps or registries the page does not link to a visitor.
- Signed-in pages only in the user's own tab, only with his go-ahead, and only what the page shows.
- Captured HTML and CSS is reference material; mention the source licence in the pack README.
