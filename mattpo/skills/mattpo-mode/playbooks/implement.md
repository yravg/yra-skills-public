### Implement

**Build one accepted slice. Leave git publication for a later ask.**

1. Read the accepted spec and the one slice. If there is no spec, say so and run `spec-and-tickets.md` only when the user wants a spec. Otherwise state the missing spec and implement only the named behavior.
2. Follow `../../tdd/SKILL.md` at the seam the spec names. Follow `../../implement/SKILL.md` for a single slice. Do not follow its commit step.
3. Use `../../implement-spec/SKILL.md` only when the user asked to orchestrate the whole spec. Ignore its worktree, merge, pull request, and cleanup steps unless they asked for those actions.
4. Run the relevant tests. Record the command and the result.
5. Run `review.md` on the diff you just made.
6. Run the QA gate in `../../mattpo/SKILL.md`.

**Reply:** what works, the test command and result, the two review results, and that you did not commit unless asked.
