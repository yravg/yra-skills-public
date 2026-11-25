---
name: captureall
description: Core rules for capturing everything from a target website or app - the capture checklist (pages, elements, tokens, fonts, themes, states, motion, responsive, a11y, IA, assets, public code), licence classes, output folders and the QA gate. Use when capturing, scraping or inventorying a site, app, component, design system or animation, when a <web-capture> block is pasted, or when the user says "robo-capture" or "captureall".
---

# Captureall

Upgraded Robo Capture. Engine, crawler and pack builder descend from the Robo Capture Chrome extension by Jay / RoboLabs (robonuggets.com), CC BY 4.0: keep that attribution in every output. Same `<web-capture>` schema as the extension, extended with `variant`, `animations`, `code`, `page`, `states` and `consoleErrors`.

Specialist skills: websites `../captureall-web/SKILL.md`, apps `../captureall-app/SKILL.md`, workbook/packs/Drive `../captureall-pack/SKILL.md`, clone plans and sweeps `../captureall-parity/SKILL.md`, shipped code as readable source `../captureall-grab/SKILL.md`, 100% rebuilds `../captureall-reanimate/SKILL.md`, match proofs `../captureall-match/SKILL.md`. For a full run, use `/captureall-mode`.

## What "everything" means

Tick each line the target has; write "n/a" for the rest.

| Area | What to capture | How (web) |
|---|---|---|
| Pages and routes | every route, title, heading, full description | `ia().routes`, `meta()`, crawl sections |
| IA | nav groups, items per group and counts, sidebar order, menus | `ia()` |
| Elements | outerHTML, text, rect, computed styles, matched CSS rules | `capture(sel)` |
| Tokens | custom properties per theme and skin, declared and resolved | `tokens()` per variant |
| Fonts | @font-face, families used, licence | `fonts()` |
| Themes and styles | every theme, skin, style toggle; how each is stored | variants (localStorage, attributes) |
| States | hover, focus, pressed, open, selected, disabled; CSS for each | `states(sel)`, crawl `states` |
| Motion | keyframes, transitions, timeline, frames, reduced motion | `animations()`, `animSnapshot()`, frames |
| Responsive | 360, 768, 1280+ widths | crawl `viewports` |
| Accessibility | roles, names, tab order, unnamed controls, live regions | `a11y(sel)` |
| Controls around previews | preview bar, code tab, copy buttons, stage rail, replay, width and theme toggles | `capture()` on the bar, screenshots |
| Keyboard | shortcuts, Escape, arrow keys in menus | page help, menus, testing keys |
| Assets | images, svgs, canvases, videos, scripts, sizes | `assets()` |
| Code | only what the page shows publicly (Code tab) | crawl `code` |
| Errors | console errors, failed resources | crawl `consoleErrors`, `errors.json` |
| Licence | free/open, Pro/gated, own, unknown per item | page labels, pricing page, LICENSE |

## Licence classes

- **Free / open:** public code may be ported with its licence and credit.
- **Pro / gated:** preview, behaviour and description only. Never fetch hidden endpoints, unlock gates, use session tokens for gated source, or copy its code, CSS or markup.
- **Own:** the user's own product.
- **Unknown:** treat as Pro.

Record the class per item in the inventory (`Pages` sheet, Access column).

## Folder and file flow

- Working files: the session scratchpad, in `captureall/<target-slug>/` (crawl config, `crawl.log`, `out/`). Never `/home/claude` on this Windows machine.
- Deliverables: `<Doc-Base>_Inventory_R00.xlsx`, `<Doc-Base>_Pack_R00_<Section>.zip`, `<Doc-Base>_Captures_R00_<Section>.zip`, plus `DESIGN.md` / `tokens.json` or per-app JSON and Markdown when those playbooks run.
- Doc-Base: `<Target>-<Scope>`, for example `AffectUI-Library`.
- Revisions: `_R00`, `_R01`; never overwrite. Drive publishing rules are in the pack skill.
- Parity work: roadmap and handoff live in the clone's repo (see the parity skill).

## QA gate

Before anything leaves the session:
1. Counts add up: captures = pages × variants (× viewports), minus listed errors; failed URLs re-run once.
2. Variants really differ: a root attribute or token value changes between two variants of the same page.
3. Descriptions are whole (no cut at a length limit); copy kept in its language.
4. Every item has a licence class; no Pro or gated code, CSS or markup in any deliverable meant for reuse.
5. Motion frames are not frozen (clock in front or headless); clone-versus-target claims were made at the same stage width and moment.
6. Every claim in the reply points to a file, screenshot or measured value.
7. Attribution line (Robo Capture, Jay / RoboLabs, CC BY 4.0) present in the workbook README and pack.
8. Nothing left running: servers, crawlers and browser tabs you started are stopped or closed.
