# captureall

Captures everything a target website or app shows: pages, elements, design tokens, fonts, themes and styles, interaction states, animations, responsive layouts, accessibility, navigation and the code it shows publicly. It is the upgraded Robo Capture skill, extended with what the yravg UI / affectui.com parity work taught (themes, IA counts, full descriptions, licence split, preview sweeps).

## Start here

Type `/captureall-mode` with any goal in your own words. You never name a skill or a playbook. For example:

- `/captureall-mode make our ai-workspace block exactly like affectui.com's, animation included`
- `/captureall-mode is our catalogue still the same as affectui.com? check every item, run until done`
- `/captureall-mode capture https://www.affectui.com: every section, light/dark x classic/clean, 360 and 1440 wide`
- `/captureall-mode extract the design tokens and fonts of https://linear.app for our DESIGN.md`
- `/captureall-mode capture the agent tree on affectui.com and plan how ours matches it`
- `/captureall-mode sweep our clone at https://uiux.yraveragehub.io for empty, erroring and overflowing previews`
- `/captureall-mode capture the main windows and menus of the desktop app Figma`
- `/captureall-mode reanimate the decision tree from affectui.com as template 2 in yravgUIUX, same motion, proven by timelines`

The mode works like poteto-mode. It restates the goal with a measurable done check and routes it to a chain of playbooks: capture, grab, reanimate, match, parity, pack. It designs a bespoke playbook when none fits, settles facts by measuring instead of asking, delegates batches, and proves the result before it replies. Add "run until done" and it keeps going through every reversible step. `/captureall-help` answers questions about the toolkit without starting work. `/captureall` alone gives the capture rules and QA gate.

## What is inside

| Skill | Purpose |
|---|---|
| captureall-mode | The manager for any task: goal and done check, routing table, 10 principles, autonomy limits, delegate agent, 13 playbooks incl. Figure it out and Autonomous run. |
| captureall | Core: what "everything" means, the capture checklist, licence classes, output folder flow, QA gate. |
| captureall-web | Websites: engine.js v3 in a browser tab, crawl.js headless crawl with variants, viewports and states. |
| captureall-app | Desktop, Electron and mobile apps: screenshots, accessibility tree, menus, shortcuts. |
| captureall-pack | Inventory workbook, zip packs, Google Drive publishing and the revision register. |
| captureall-parity | Turn a capture into a clone plan (gap list, roadmap, handoff) and sweep the clone. |
| captureall-grab | The code a target already ships, as readable source: bundle registry, demo/docs/CSS chunks, literal parser. Never runs it. |
| captureall-reanimate | Rebuild UI and motion 100% like the target (verbatim port when the licence allows, observed rebuild otherwise): port brief, pitfalls, stage rules. |
| captureall-match | Prove clone = target: text fingerprints on both origins, animation timelines at the same stage width, compare script. |
| captureall-help | How to use the toolkit. |

Agent: `captureall-agent`, the delegate the mode uses for capture batches, port batches and independent checks.

## Notes

- Engine, crawler and pack builder descend from the Robo Capture Chrome extension by Jay / RoboLabs (robonuggets.com), CC BY 4.0. Keep this attribution in every output.
- Playwright is not installed globally. In a scratch folder: `npm i -D playwright && npx playwright install chromium`. Without it, use the built-in browser or Claude in Chrome with engine.js.
- The pack builder needs `pip install openpyxl pillow`.
- Once installed, remove the standalone `robo-capture` skill so only one copy answers (confirm before deleting).
