### Docs health

**Inventory the docs the repo already has. Propose a cleanup. Do not apply it in the audit.**

Source and adaptation. The 22 November 2026 study of NetworkChuck's interview with Matt Pocock (https://youtu.be/mU8WKII1gpk) records these teachings: look at the current code and the shared glossary before asking questions the repo can answer; keep domain language separate from implementation; write an ADR only for a hard-to-reverse trade-off; review spec and standards separately; survey architecture and let the user choose. That study also records his personal scheduled refactors and a rough context size he said was not the point. Those sentences are the study's paraphrase, not a new transcript and not a quotation. The steps below are the yravg adaptation: one canonical file per subject, a short pointer plus on-demand detail, and commands marked RUN or NOT RUN. No scheduled refactor. No measured token saving.

1. This playbook is read-only until the user accepts a named hunk for this repository. A request to change the mattpo plugin is not permission to edit a product repo's glossary, architecture notes, ADRs, or standards.
2. Inventory files that already exist. Look for a glossary, a domain model, architecture notes, ADRs, AGENTS.md, CLAUDE.md, and other standards. Record the path and whether you opened it. A missing kind is "not found", not a file you invent.
3. For each claim that matters to the task, compare it with the code or with another accepted doc. Label it current, stale, contradicted, or duplicated. Cite both paths. Do not delete the accepted decision.
4. Propose one canonical source per subject. Name the always-loaded pointer (a short section that links the canonical file) and which documents stay on demand. Leave accepted constraints in the canonical file.
5. Record reproducible checks from the repo's own docs and scripts: prerequisite, tool version, environment, and the exact setup, build, test, and verify commands. Mark each command RUN with the result you saw, or NOT RUN. Do not invent a green run.
6. Deliver the proposed hunks. Apply one only after the user accepts that hunk for this repo. Do not rewrite the set in one silent pass, and do not start a code refactor or a new baseline from this playbook.
7. Run the QA gate in `../../mattpo/SKILL.md`.

**Reply:** the inventory, the stale or duplicate claims with paths, the one proposed source per subject, every command marked RUN or NOT RUN, and the hunks you did not write.
