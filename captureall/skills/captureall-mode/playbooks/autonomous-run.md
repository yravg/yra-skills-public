### Autonomous run

**Drive a chain of playbooks to its done check without stopping, for "run until done", "I'm away" or a long goal.**

1. Write the goal, the chain and the done check. Copy the chained playbooks' steps into the task list.
2. Start the checkpoint file with the plan, and a decision log section for every call you make on Enrico's behalf.
3. Split the work into units that each end in a check (one section, one batch of 4-6 items, one sweep). Run independent units in parallel with delegates, each with its own tab and scratch folder.
4. After every unit: verify it, land its output (file, commit on the working branch), rewrite the checkpoint.
5. A failed check: find the root cause, fix it once in the shared code, re-run the unit. Two fixes on the same premise failed → test the premise itself before a third.
6. An Always-pause item: do not stop. Park it in a "needs Enrico" list with your recommendation, and continue with every unit that does not depend on it.
7. When every unit is done, measure the done check over the whole result. Run the `captureall` QA gate. Stop every server, crawler and tab you started.

**Reply:** the done check result, units done and their evidence, the decision log, the "needs Enrico" list with recommendations, and the link to check.
