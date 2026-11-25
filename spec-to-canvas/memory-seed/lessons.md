# spec-to-canvas lessons

Read at the start of every run. Every line came from real work; the evidence is in the brackets.
Add new lines with `node scripts/memory.mjs add`. When Inbox passes 10 lines, fold them into the themed sections and delete duplicates.

## Capture and design
- Write the evidence of a board as text beside the picture. Reviewers that are models read the text, not the image. [solvarium main-pages-ui]
- Triage pages before drawing: score = need + value - half the rebuild risk. Verdict per page: redesign, light pass, leave. [solvarium main-pages-ui]
- Copy the design source into the repo (`vendor/<name>`) with a README that says the commit, how to re-sync and how to use the pieces. Then build pages from real pieces, not look-alikes. [solvarium projects-home]
- Keep a catalogue map: which design item lands on which page. [solvarium catalogue-map.md]
- Owner rules said on a canvas become standing rules for every board: no control removed for a look; every rebuilt board has Before and After; a chart the owner called good is built as drawn. [solvarium 2026-11-01]
- Default test standard per page: 1024 px, longer strings (German length), keyboard, no project open, stored layout kept, reduced motion. Add 390 px, dark, EN and ID when the app has them. [solvarium, milestone]

## Build order and status
- One commit per board. Name the paths in the commit (`git commit -- <paths>`). Look at `git diff --cached` first: a shared index swept another session's staged files into commit ed26bba05. [solvarium canvas-boards]
- Check other sessions' claims on a file before a board starts. A board that overlaps a claim is `blocked`, not forced. [solvarium step 12]
- Demo data first. A feature with no demo data reads as a missing feature. Demo packs reach new copies only: say so. [solvarium step 3]
- Never build a store or control nothing reads. A dead control is worse than a missing one. Mark it open with the reason. [solvarium S08]
- A board that needs a server side is an owner decision. Build a visible "not connected" state, send nothing, name the blocker. [milestone r3 cloud]
- Status words: `done`, `done, part blocked`, `done, part open`, `open`, `blocked`. Each with commit SHA and the tests by name. Leftovers named in the same row. [both]
- Use real card or feature IDs only. A made-up ID in a commit (`T-demos`) misleads the tracker. [solvarium 5ada69778]
- Record each owner delegation ("pick the recommended option") as a Decision line with its reason. [milestone v2-revamp]
- A gate with unknown origin: run the suite on the commit before the wave, so a later failure has a baseline. [solvarium fast gate 2026-11-02]

## Checks
- A check that calls the app API (`TL.*`) misses what a person hits. Drive the real UI with real input (CDP mouse and key events, the browser's own file chooser). This found a PowerPoint export hang and a dblclick bug that API checks passed. [milestone usable-b]
- No fixed sleeps in checks; wait on a condition. A fixed sleep failed 1 run in 10. [milestone usable-b]
- Verify exports with an outside tool (openpyxl, python-pptx, pypdf, xml.etree), not with the app's own reader. [milestone usable-b]
- Low memory machine: run browser checks one at a time; the full editor check once per round, area-only checks per change. [milestone]
- A batch of bug fixes gets its own guard script. [solvarium test-main-bugs-ui]
- Report honest known gaps in the handoff, with file and cause. Do not round up "partly" to "done". [both]

## Repo and tooling
- Mark `assets/vendor/** -text` in `.gitattributes`: a CRLF clone breaks SRI hashes. [milestone 74be4e2]
- Do not commit `dist` while another session has uncommitted app changes. [milestone SHELL.3-5]
- The handoff file is rewritten after every finished step; the roadmap changes only when scope changes. [both]
- If `orca` or the Hub MCP is missing, say so and tell the owner to re-install or authorise; commits then carry a feature code. [solvarium canvas-boards]

## Inbox (unsorted, newest last)
