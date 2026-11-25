### Design review

**Audit an existing screen, fix what matters, prove it with a re-scan.**

1. Read the `tastestack` core skill and the project's decision log, if it has one.
2. Name the files and the states to review. Render each state and view it.
3. Run the slop scan on the files. Keep the score and the finding IDs.
4. Critique by the impeccable reference files (critique, audit, layout, typeset). Score the screen 0-4 on each heuristic, in writing.
5. If the screen is a product mock, judge it against the stageshow review and verify references.
6. List findings P0-P3, each with its tool, file and line.
7. Fix P0-P2 as a diff. Keep every control and decision. Tokens only.
8. Re-scan, re-render, view every state again. Run contrast on any doubtful pair.
9. Run the `tastestack` gate.

**Reply:** scan score before and after, critique scores before and after, findings fixed, findings left with the reason, states not viewed.
