---
name: tastestack-help
description: 'Explains the tastestack plugin: how to start a task with /tastestack-mode, which skill or playbook fits a situation, and how to word a request. Used for /tastestack-help or questions about how to use the design toolkit.'
disable-model-invocation: true
---

# Tastestack help

Answer the user's question about the toolkit and hand them a request they can send. Do not start the work for a help question. If the message actually asks for work ("audit the CH08 board"), read `../tastestack-mode/SKILL.md` and do it under that mode instead.

## Starting a task
Type `/tastestack-mode` followed by the goal and how to tell it is done. The mode picks a playbook, copies its steps into the task list, calls the tools, and pauses only for its Always-pause list (upstream sync, global tokens, removing controls, publishing).

- `/tastestack-mode audit the Settings boards, fix P0-P2, give before and after scores`
- `/tastestack-mode build the onboarding screen from this brief, tokens only`
- `/tastestack-mode make a faux dashboard for the landing page hero`
- `/tastestack-mode three banner directions for the launch`
- `/tastestack-mode is there a newer impeccable?`

## Which playbook
| Situation | Playbook |
|---|---|
| Audit one existing screen | Design review |
| Many canvas boards | Canvas board pass |
| New screen from a brief | Build new screen |
| Faux UI or demo | Product mock |
| Banners, slides, logos | Brand assets |
| Colours, themes, dark mode | Tokens and theme |
| Update the upstreams | Upstream sync |
| A question, no file change | Investigation |
| Continue earlier work | Session pickup |

## Which skill on its own
- Core facts and gate: `/tastestack`
- Critique and polish rules: `/impeccable`
- Slop scan and tokens: `/tastemaker-guard`, `/tastemaker-tokens`
- Faux product UI: `/stageshow`
- Updates: `/taste-sync` or `/tastestack-sync`

Single skills are fine for a quick look-up; use `/tastestack-mode` for anything that changes a file.

## Common problems
- "Impeccable CLI blocked": expected; the mode reads its reference files and scores by hand.
- "Sync says REFUSED": an upstream licence changed. Read the file named; do not work around it.
- "Update warning at session start": the daily check found newer upstreams; run `/taste-sync`.
