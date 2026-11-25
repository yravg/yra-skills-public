# One source, opened on demand

**When:** a glossary, domain model, architecture note, ADR, or standards file overlaps another, or a session is about to load all of them.

One subject has one canonical file. The always-loaded instruction names that file and the situation that should open it. Open the detailed file when the task needs it. Do not paste the whole document into the prompt.

Rules:
- A second copy becomes a pointer, or a proposed deletion, after the user accepts that hunk.
- This is so the next session loads less text. It is not a measured token saving.
