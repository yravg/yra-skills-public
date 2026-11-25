# Fan out by file ownership

**When:** the work covers many files or boards and you want parallel delegates.

Split by file. One delegate owns a file; two never touch the same one.

Rules:
- Write the groups down with their files before you spawn anything.
- Shared files (tokens, build outputs, index files) stay with the lead.
- Each delegate commits only its own paths and keeps a checkpoint.
- The lead runs the combined build, lint and render once at the end.
