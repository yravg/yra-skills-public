---
name: captureall-parity
description: Turn a capture of a target site or app into a clone plan and check the clone - gap list per area, licence-aware fixes, roadmap and handoff files, side-by-side screenshots and a preview sweep (every preview x theme at phone width for empty, error, broken image and overflow). Use when the user wants their product "the same as" a target, asks for a gap list or parity plan, or wants a clone verified.
---

# Captureall parity

Script in `scripts/`: `sweep.js` (preview sweep in a browser tab). Templates in `references/parity-files.md`.

## Gap areas

Check each area on target and clone, same viewport, theme and moment:

| Area | Compare |
|---|---|
| IA | nav groups, group order, item counts per group, sidebar, top menu columns, routes |
| Landing | sections in order, hero, tabs, live previews, screens frame size, compare sliders, FAQ |
| Item pages | heading, full description, preview stage size, examples, usage, props, code |
| Preview controls | preview/code switch, copy prompt buttons, copy button, stage rail (replay, theme, style, width, reduced motion) |
| Themes | theme and skin list, how chosen, where stored, what each changes |
| Tokens and fonts | palette per theme, type scale, radius, shadow, fonts |
| Motion | entrance, hover, replay, stagger, durations, easings, reduced-motion behaviour |
| States | hover, focus ring, pressed, open menus, keyboard shortcuts |
| Responsive | 360, 768, 1280+; rails and bars that change layout |
| Accessibility | names, tab order, roles, contrast |
| Copy | text whole, tone, no banned words for the clone's own rules |

## Gap list row

`area | item | target evidence | clone evidence | licence class | fix | size S/M/L | status`

- Free/open target code: the fix may port it, with licence file and credit.
- Pro/gated target: the fix is an own implementation from the description and observed behaviour. Never copy its code, CSS or markup.

## Roadmap and handoff

A parity effort spans sessions, so it keeps two committed files in the clone's repo (global CLAUDE.md rule): roadmap at the repo's plan folder or `docs/roadmap/<feature>.md`, handoff at `docs/handoff/<feature>.md`. Formats in `references/parity-files.md`. Rewrite the handoff after every finished step.

## Sweep

1. Build the list of preview paths (relative to the clone origin).
2. Open a tab in front on a plain page of the clone origin (a .txt or licence file).
3. `javascript_tool`: set `window.SWEEP_CFG = { list, themes: [{name:'dark', localStorage:{...}}, {name:'light', localStorage:{...}}], width: 360, rootSelector: '#root', restore: {...} }`.
4. `javascript_tool`: the text of `scripts/sweep.js` (returns `started`).
5. Poll `JSON.stringify({done: SW.done, total: SW.total, fin: SW.fin, bad: SW.bad.length})` every 30-60 s; when `fin`, read `SW.bad`.
6. Recheck each bad row once by hand; artefacts (frozen clock, stale cache, cross-origin) are listed apart from real bugs.

Known limit: errors thrown during a preview's first render are missed (listener attaches after load). Open one failing preview with the console to confirm.

## Side-by-sides

Screenshot target and clone at the same viewport, theme and animation moment; save as `<item>_target.png` / `<item>_clone.png`; cite them in the gap list.
