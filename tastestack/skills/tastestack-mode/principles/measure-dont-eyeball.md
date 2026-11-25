# Measure, don't eyeball

**When:** you are about to say a screen is clean, readable or better.

Run the scan, the contrast script and a render. Say the numbers.

Rules:
- Slop scan (`tastemaker-guard`) before and after. Report `score`, errors and warnings, not "looks fine".
- Doubtful text colour pairs go through `tastemaker-tokens/scripts/contrast.mjs`. Report the ratio.
- View every state's render yourself. A passing lint is not a view.
- Impeccable critique scores are written down before and after the fix.
