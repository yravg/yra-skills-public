### Architecture

**Report one structural problem. Stop for a choice.**

1. If the request is to reconcile or shorten a glossary, domain model, architecture note, ADR, or standards file, stop and run `docs-health.md`. This playbook is for one code-structure candidate. Follow `../../improve-codebase-architecture/SKILL.md` and `../../codebase-design/SKILL.md` for the vocabulary. Scope the report to the area the user named.
2. Give the candidates, the behavior to preserve, and the rollback. Do not apply one.
3. Do not schedule a daily or recurring pass.
4. Run the QA gate in `../../mattpo/SKILL.md`.

**Reply:** the candidates and the choice you need. No code change unless they already picked one and asked you to make it.
