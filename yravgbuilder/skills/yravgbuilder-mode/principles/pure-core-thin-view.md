# Pure core, thin view

**When:** a feature has any rule, calculation, parser or transformation.

Put the rule in a pure module with a contract header and typed results. The view only calls it and renders.

Rules:
- No DOM, fetch, Date.now, Math.random or storage inside the core.
- Hand-computed failing test first; one case per refusal.
- The suite is wired into the test runner and CI in the same commit.
