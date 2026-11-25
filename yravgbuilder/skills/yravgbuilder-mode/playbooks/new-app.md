### New app

**Start a business app on the house stack with its gates in place from day one.**

1. Write the one-page brief: users, jobs, data, roles, tenants, platforms (web, Windows, macOS). Ask the owner what the sources do not answer.
2. Pick the stack from the `yravgbuilder` default table. Run the Rust decision (`../../yravgbuilder-rust/SKILL.md` section 1) on each candidate core; most apps get "no Rust candidate".
3. Scaffold Vite + React (and a Node server if needed). Add the token file, the token bridge and the house font from `../../yravgbuilder-ui/SKILL.md`.
4. Pull the shell, table, form, empty state and skeleton pieces from the yravg catalogue (`search`, `add`). List what was reused.
5. Add the test runner with one hand-computed suite, the CI workflow, CHANGELOG.md, a samples/demo entry and a README "how to run".
6. Write the roadmap and handoff files (`../../yravgbuilder-feature/SKILL.md` section 1).
7. Run the `yravgbuilder` QA gate on the first screen.

**Reply:** stack chosen and why, Rust verdict per core, what was reused, the gates in place, link to the running app, what was not checked.
