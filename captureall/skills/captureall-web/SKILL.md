---
name: captureall-web
description: Capture websites and web apps - engine.js v3 injected into a browser tab (built-in browser or Claude in Chrome) for elements, tokens, fonts, a11y, states, IA and motion, and crawl.js (Playwright) for whole sites with theme/style variants, viewports and interaction states. Use when the capture target is a URL, a web app or a local dev server.
---

# Captureall web

Scripts in `scripts/`: `engine.js` (in-page API, `window.__robo`) and `crawl.js` (headless whole-site crawler). Both descend from Robo Capture (Jay / RoboLabs, CC BY 4.0).

## Choose a mode

- **A. In a tab:** specific elements, signed-in pages (only with Enrico's go-ahead), quick probes, design-system extracts. Built-in browser by default; Claude in Chrome for his own signed-in Chrome.
- **B. Crawl:** public sites, many pages, every variant, frames and GIFs. Needs Playwright.

## Engine API (v3)

Inject the full text of `scripts/engine.js` with `javascript_tool` (Mode A) or `page.addScriptTag` (Mode B). Then:

| Call | Returns |
|---|---|
| `__robo.capture(el\|sel, {animations:true})` | web-capture record: outerHTML, text, rect, computed styles, matched rules, animations |
| `__robo.captureAll(sel, opts)` | array of records |
| `__robo.tokens()` | html attributes, custom properties declared per root/theme selector, resolved values now |
| `__robo.fonts()` | @font-face rules, families used, loaded faces |
| `__robo.a11y(root)` | nodes with role, name, state; tab order; unnamed focusables; reduced-motion rules |
| `__robo.states(el\|sel)` | CSS rules for :hover, :focus, :active, aria states that apply to the element |
| `__robo.ia()` | nav landmarks, link groups with headings and counts, same-site routes |
| `__robo.assets()` | resources with sizes, images, svg/canvas/video counts |
| `__robo.meta()` | title, heading, FULL description, meta tags, `?v=` asset versions |
| `__robo.animSnapshot(el)` | running animations now (for timelines) |
| `__robo.wrap(caps)` | paste-ready `<web-capture>` text |

Results over ~40 KB: `window.__rc_s = JSON.stringify(x)`, read `window.__rc_s.length`, then read `window.__rc_s.slice(i, i + 40000)` in successive calls and join them in a file.

## Mode A steps

1. Open the page in a tab in front. Shared browser pane: open your own tab with `tabs_create`; do not drive a tab another agent uses.
2. Inject engine.js; check `__robo.version === '3.0.0'`.
3. Probe: `__robo.meta()`, `__robo.ia()`, `document.querySelectorAll('<preview selector>').length`.
4. Find how themes and styles are stored: `Object.keys(localStorage)`, `document.documentElement.attributes`, the page's own toggles.
5. Per variant: set it (localStorage then reload, or click the page's control), wait ~4.5 s, capture.
6. States: `states(sel)` for the CSS; for the real look, hover or focus with the `computer` tool, then capture again and screenshot.
7. Motion: sample `animSnapshot(el)` after reload or the page's replay control; screenshot each sample.

## Mode B steps

1. Setup once, in a scratch folder: `npm i -D playwright && npx playwright install chromium`, then copy `scripts/engine.js` and `scripts/crawl.js` there.
2. Write `cfg.json`. Example (affectUI preset, upgraded):

```json
{"out":"out","selector":"div.stage","fallbackSelector":"main","captureIndex":true,
 "sections":[{"name":"Components","index":"https://www.affectui.com/components","linkPrefix":"/components/"},
  {"name":"Screens","index":"https://www.affectui.com/screens","linkPrefix":"/screens/"},
  {"name":"Blocks","index":"https://www.affectui.com/blocks","linkPrefix":"/blocks/"},
  {"name":"Illustrations","index":"https://www.affectui.com/illustrations","linkPrefix":"/illustrations/"},
  {"name":"Motion","index":"https://www.affectui.com/motion","linkPrefix":"/motion/"}],
 "variants":[{"name":"light-classic","localStorage":{"theme":"light","affectui-style":"classic","aui_offer":"null"}},
  {"name":"dark-classic","localStorage":{"theme":"dark","affectui-style":"classic","aui_offer":"null"},"colorScheme":"dark"},
  {"name":"light-clean","localStorage":{"theme":"light","affectui-style":"clean","aui_offer":"null"}},
  {"name":"dark-reduced","localStorage":{"theme":"dark","affectui-style":"classic","aui_offer":"null"},"colorScheme":"dark","reducedMotion":"reduce"}],
 "viewports":[{"name":"360","width":360,"height":780},{"name":"1440","width":1440,"height":900}],
 "states":[{"name":"hover-button","action":"hover","target":"button"},{"name":"focus-input","action":"focus","target":"input"}],
 "pageData":true,"settleMs":4800,"frameTimes":[100,400,900,1600,2600,4200],"code":{"tab":"Code","block":"pre"},"concurrency":5}
```

   Use `"pages":[urls]` instead of `sections` for a fixed list. Omit `variants` for one default view, `viewports` for one 1600×900 view.
3. Run in the background: `node crawl.js cfg.json > crawl.log 2>&1`. About 25 captures a minute at concurrency 5; viewports and states multiply the time.
4. Watch `crawl.log`; read `out/errors.json`; re-run failed URLs with `"pages"`.
5. Hand `out/` to the `captureall-pack` skill.

## Capture record fields

Extension fields (`id, selector, label, tag, url, title, timestamp, innerText, outerHTML, rect, computedStyles, cssRules`) plus `variant`, `animations` (keyframes, cssAnimations, transitions, timeline, frames), `code` (blocks from the Code tab, or a note), `page` (tokens, fonts, a11y, cssStates, ia, meta, assets), `states` (per state: computed styles and a frame), `consoleErrors`, `_meta` (section, slug, heading, full description, element and control counts, proLocked).

## Pitfalls

- Hidden tabs freeze animation clocks: a blank frame with `currentTime` 0 is an artefact.
- Cross-origin stylesheets cannot be read (`fonts().faces` lists them as `blockedSheet`); capture their effect with computed styles.
- A stale cached stylesheet looks like a layout bug: compare `meta().assetVersions` with the deployed files.
- Code tabs: capture only what the page shows. A Pro or gated item gets "Pro-gated: preview only".
