---
name: to-questionnaire
description: Turn a decision you can't fully answer into a questionnaire for someone else to fill in.
disable-model-invocation: true
---
<!-- yravg-adapter:begin -->
# yravg adapter

This block is a yravg adaptation. It is not part of Matt Pocock's upstream skill. The text after the end marker is verbatim upstream text from mattpocock/skills. MIT, Copyright (c) 2026 Matt Pocock. This copy is not an endorsement by Matt Pocock.

Pinned commit: `abeeaf95660ba9e8b7c753eb38f441ca707a8823`.

When the user asks you to change a specific file or write a specific document, do that change. Repo instructions and an owner decision outrank this skill. Ask the single highest-impact unresolved question, then wait. A recommended answer is not consent. Do not start a refactor, a scheduled architecture pass, or a product change the user did not ask for. Test observable behavior. A screenshot supports a visual claim only.

These actions stay off until the user asks for that action in this conversation: publishing or editing an issue tracker, changing labels, opening or merging a pull request, git commit, push, reset, worktree delete, deploy, sending a message, billing, installing a hook or dependency, and applying an upstream snapshot.

Draft the questionnaire. Do not send it.

<!-- yravg-adapter:end -->

Turn something the user can't answer alone into a **questionnaire**: a Markdown document they hand to one person to fill in async, or fill out together over a meeting. The recipient holds knowledge the user lacks; the questionnaire pulls it out of them.

**Grill the send, not the subject.** Interview the user only about the _send_, which they can always answer: who it goes to, and what they need back. The questions in the document then target the **gap** between what the recipient knows and what the user needs.


1. **Who is it going to?** Ask, in one exchange, the recipient's role, expertise, and relationship to the user. This fixes the questionnaire's tone and how much context it must carry. Done when you know who the recipient is and what they know that the user doesn't.

2. **What do you need back?** Ask, in one exchange, the specific decisions or facts the user can't resolve alone and needs from this person. Done when you have a concrete list of what the user must walk away able to do or decide.

3. **Write the questionnaire.** Draft questions aimed at the gap from steps 1–2, following the Document structure below. Write it to `to-questionnaire-<slug>.md` in the current directory (slug from the topic) and report the path. Done when the file exists and every item the user named in step 2 is covered by a question.

## Document structure

Frame the document as a **discovery questionnaire**: the user lacks context, the recipient holds it. Order questions most-important-first, since async means you may only get one pass, and group them under `##` headings by theme once there are more than a handful. Write it using the template below.

<questionnaire-template>

# <Questionnaire title>

**Purpose:** why this questionnaire exists and the decision riding on it.

**From:** <the user>, **To:** <the recipient>, **How your answers will be used:** <where they go>

## Context

One paragraph orienting a recipient who wasn't in the user's head. Enough to answer well, not a page.

## How to answer

Deadline and rough effort. Partial answers and "I don't know" are useful: flag anything you're unsure of rather than skipping it.

## <Theme heading>

One `##` section per theme. Under each, its questions, most-important-first. Every question is one idea, never compound, with an answer stub directly beneath, and a one-line _why this matters_ only where the question could be misread or invite a throwaway answer.

<question-example>
### What load is the system expected to handle at launch?

_Why this matters: it decides whether we provision for burst traffic now or defer it._

>
</question-example>

## Anything else?

A closing catch-all: anything we didn't ask that we should know?

</questionnaire-template>
