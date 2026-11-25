### Design review

**Audit an existing screen, fix P0-P2, prove the change.**

1. Render the screen as it is (Before) at 1440, 1024 and 390 px, and in dark mode.
2. Run the slop scan on its files and read the slop checklist against the render.
3. Critique with the impeccable references through tastestack (`critique.md`, `audit.md`). Score each heuristic.
4. Check the house rules: reuse, tokens, states, icons, accessibility, dead or missing controls (`../../yravgbuilder-ui/SKILL.md`).
5. Fix P0-P2 as a diff. Keep every control and every logged decision.
6. Render After, re-scan, and compare Before with After.
7. Run the `yravgbuilder` QA gate.

**Reply:** findings by severity with file:line, scan score before and after, heuristic scores, Before/After images or link, what was not fixed and why.
