---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---
<!-- yravg-adapter:begin -->
# yravg adapter

This block is a yravg adaptation. It is not part of Matt Pocock's upstream skill. The text after the end marker is verbatim upstream text from mattpocock/skills. MIT, Copyright (c) 2026 Matt Pocock. This copy is not an endorsement by Matt Pocock.

Pinned commit: `abeeaf95660ba9e8b7c753eb38f441ca707a8823`.

When the user asks you to change a specific file or write a specific document, do that change. Repo instructions and an owner decision outrank this skill. Ask the single highest-impact unresolved question, then wait. A recommended answer is not consent. Do not start a refactor, a scheduled architecture pass, or a product change the user did not ask for. Test observable behavior. A screenshot supports a visual claim only.

These actions stay off until the user asks for that action in this conversation: publishing or editing an issue tracker, changing labels, opening or merging a pull request, git commit, push, reset, worktree delete, deploy, sending a message, billing, installing a hook or dependency, and applying an upstream snapshot.

<!-- yravg-adapter:end -->

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to the temporary directory of the user's OS (`$TMPDIR`, else `/tmp`; `%TEMP%` on Windows) - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
