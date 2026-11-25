### Canvas board pass

**Audit and fix many design-canvas boards in parallel without two workers on one file.**

1. Read the project's decision log and the canvas build and lint commands.
2. List the board files. Split them into groups by file. Write the groups down.
3. Pick the shared files (tokens, build outputs, index). The lead owns them.
4. Spawn one `tastestack-agent` per group. Each prompt gets: the mode file's absolute path, the group's files, the decision log path, the design-review steps, the commit rule (own paths only, no push), the checkpoint rule.
5. Check each delegate's report: scores, fixes, commits. Open the render of at least one board per group yourself.
6. Run the combined build, lint and render once. Every board must pass and render with no errors.
7. Commit the build outputs as the lead. Record the round in the project's handoff.

**Reply:** per group the scan and critique scores before and after, top fixes, what is left, commit SHAs, boards not viewed.
