### Build screen

**Go from a brief to one business screen that passes the gate.**

1. Read the brief, the decision log and the handoff. List users, jobs, data and every state.
2. Search the repo and the catalogue for each piece (`../../yravgbuilder-ui/SKILL.md` section 1). Match the patterns in `../../yravgbuilder-ui/references/enterprise-patterns.md`.
3. Put any rule in a pure core with a failing test first (`../../yravgbuilder-feature/SKILL.md` sections 2-3).
4. Build the view from reused pieces: tokens only, every state, real handlers only.
5. Run the slop scan (tastestack bridge in `../../yravgbuilder/SKILL.md`) and read `../../yravgbuilder-ui/references/slop-checklist.md`. Fix errors.
6. Render at 1440, 1024 and 390 px, keyboard only, dark mode. View each state.
7. Add the sample, the how-to and the CHANGELOG entry.
8. Run the `yravgbuilder` QA gate.

**Reply:** files, what was reused and what is new (with reason), scan score, states viewed, test output, link to the screen, what was not checked.
