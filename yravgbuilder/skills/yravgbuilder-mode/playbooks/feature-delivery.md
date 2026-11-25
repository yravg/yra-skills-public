### Feature delivery

**Take one PRD row from missing to done.**

1. Read the PRD row and the handoff. Restate the acceptance as observable checks.
2. Write the contract header and a hand-computed failing test (`../../yravgbuilder-feature/SKILL.md`).
3. Build the pure core until the test passes; add refusal and edge cases.
4. Build or extend the view with Build screen steps 2-6.
5. Wire the suite into the runner and CI in the same commit.
6. Add sample data, demo coverage, the in-app how-to and the CHANGELOG (and What's new) entry.
7. Commit with explicit paths and the card code. Update the PRD row and the handoff.
8. Run the `yravgbuilder` QA gate.

**Reply:** PRD row status with evidence, commit SHA, tests run with results, sample and how-to location, link to check, what was not checked.
