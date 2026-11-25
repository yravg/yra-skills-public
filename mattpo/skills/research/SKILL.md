---
name: research
description: Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.
---
<!-- yravg-adapter:begin -->
# yravg adapter

This block is a yravg adaptation. It is not part of Matt Pocock's upstream skill. The text after the end marker is verbatim upstream text from mattpocock/skills. MIT, Copyright (c) 2026 Matt Pocock. This copy is not an endorsement by Matt Pocock.

Pinned commit: `abeeaf95660ba9e8b7c753eb38f441ca707a8823`.

When the user asks you to change a specific file or write a specific document, do that change. Repo instructions and an owner decision outrank this skill. Ask the single highest-impact unresolved question, then wait. A recommended answer is not consent. Do not start a refactor, a scheduled architecture pass, or a product change the user did not ask for. Test observable behavior. A screenshot supports a visual claim only.

These actions stay off until the user asks for that action in this conversation: publishing or editing an issue tracker, changing labels, opening or merging a pull request, git commit, push, reset, worktree delete, deploy, sending a message, billing, installing a hook or dependency, and applying an upstream snapshot.

Put the cited notes in the reply, or in a path the user named.

<!-- yravg-adapter:end -->

Spin up a **background agent** to do the research, so you keep working while it reads. Start it with a fresh context window.

Its job:

1. Investigate the question against **primary sources** (official docs, source code, specs, first-party APIs), not a secondary write-up of them. Follow every claim back to the source that owns it.
2. Write the findings to a single Markdown file, citing each claim's source.
3. Save it where the repo already keeps such notes; match the existing convention, and if there is none, put it somewhere sensible and say where.
