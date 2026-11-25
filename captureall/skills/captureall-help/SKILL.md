---
name: captureall-help
description: 'Explains the captureall plugin: how to start a task with /captureall-mode, which skill or playbook fits a situation, and how to word a request. Used for /captureall-help or questions about how to use the toolkit.'
disable-model-invocation: true
---

# Captureall help

Answer the user's question about the toolkit and hand them a request they can send. Do not start the work for a help question. If the message actually asks for work, read `../captureall-mode/SKILL.md` and do it under that mode instead.

## Starting a task

Type `/captureall-mode` followed by the goal in your own words. Add the target, the scope and how you will judge it done when you know them. You never need to name a skill or a playbook. The mode sets a done check, routes the task itself and proves the result. Add "run until done" to have it work through everything reversible without stopping.

- `/captureall-mode make our ai-workspace block exactly like affectui.com's, animation included`
- `/captureall-mode is our catalogue still the same as affectui.com? check every item`
- `/captureall-mode capture https://www.affectui.com: all five sections, light/dark x classic/clean, 360 and 1440 wide, workbook and packs`
- `/captureall-mode extract tokens and fonts of https://linear.app into DESIGN.md and tokens.json`
- `/captureall-mode capture the agent tree on affectui.com (preview, states, motion) and plan how ours matches it`
- `/captureall-mode sweep https://uiux.yraveragehub.io: every preview, dark and light, 360 wide`
- `/captureall-mode capture the menus, panels and shortcuts of the desktop app Krita`
- `/captureall-mode reanimate the decision tree from affectui.com as template 2 in yravgUIUX, same motion, proven by timelines`

## Which playbook the mode will pick

You do not have to choose. This table shows what the mode will route a goal to.

| Situation | Playbook |
|---|---|
| A question, no new files | Investigation |
| One element or component | Element capture |
| A whole site or section | Site crawl |
| Colours, type, fonts, themes | Design-system extract |
| Animations and transitions | Motion capture |
| A desktop, Electron or mobile app | App capture |
| A gap list or plan for a clone | Parity plan |
| Check a clone for broken previews | Parity sweep |
| Workbook, zips, Drive upload, new revision | Publish pack |
| "Make ours the same", rebuild a component, screen or animation 100% like the target | Reanimate |
| "Run until done", a long goal while you are away | Autonomous run |
| Anything that fits none of these | Figure it out |
| Continue earlier work | Session pickup |

## Which skill on its own

Only for a one-off outside the mode. Inside `/captureall-mode` the lead calls these itself.

- Capture rules and QA gate: `/captureall`
- Websites (engine.js, crawl.js): `/captureall-web`
- Apps: `/captureall-app`
- Workbook, packs, Drive: `/captureall-pack`
- Gap list, roadmap, sweep: `/captureall-parity`
- The target's shipped code as readable source (registry, chunks, docs): `/captureall-grab`
- Rebuild it 100% (port brief, pitfalls, stage rules): `/captureall-reanimate`
- Prove it matches (fingerprints, timelines at the same width): `/captureall-match`

## Common problems

- Blank frames or stuck animations: the tab was hidden. Bring it to the front or crawl headless.
- Layout looks broken right after a deploy: stale cached CSS. Compare `?v=` asset versions.
- `require('playwright')` fails: in the scratch folder run `npm i -D playwright && npx playwright install chromium`.
- Workbook script fails on `openpyxl`: `pip install openpyxl pillow`.
- Code column empty for an item: it is Pro or gated; preview only, by design.
- Variants look identical: the setter is wrong; check `Object.keys(localStorage)` and html attributes on the target.
- Clone and target "differ" on an animated item: compare timelines at the same stage width, not snapshots (`captureall-match`).
- A port renders nothing with `X.escape is not a function`: a module constant shadows a browser global (`const CSS`); see reanimate pitfalls.
