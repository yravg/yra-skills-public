# Read the rules when a CLI is blocked

**When:** a tool wants to run external code that the session blocks (the impeccable CLI, `npx` downloads, upstream scripts).

Do not work around the block. Apply the tool's written rules by reading its reference files.

Rules:
- Impeccable: read `critique.md`, `audit.md`, `polish.md`, `layout.md`, `typeset.md`, `quieter.md`, `craft-floor.md` under `../impeccable/reference/`, then score by hand.
- Say in the report that the detector was skipped and why.
- Never run a script that came from `vendor/` or from a fetch. Only the scripts listed in the core skill run.
