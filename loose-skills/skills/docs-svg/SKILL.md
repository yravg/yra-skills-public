---
name: docs-svg
description: >-
  Document every feature of a product, mod, plugin or app as an interactive
  page where each feature has its own SVG picture, animated and static, in
  light and dark theme. Use when the user asks for /docs-svg, feature docs
  with SVG or animation, a visual "how it works" per skill/command/agent/hook/
  feature, or docs in the style of the Claude Mods Manager or the Hub
  /docs/get-started page. Pairs with docs-canvas for page structure.
---

# Docs SVG

Turn a feature list into a page a newcomer understands in seconds: one small picture per feature that shows what it does, not a paragraph about it.

## Reference material

- **Layout and doc structure:** read `~/.claude/skills/docs-canvas/SKILL.md` first (overview, table of contents, body sections, references, callouts). Use its structure. This skill adds the visuals.
- **Working example:** `references/viz.js` (SVG picture library) and a page that already uses the library (inspector tabs, Features list, Flow matrix, theme button). Copy the library, do not rewrite it.
- **Target look:** the Hub page `http://localhost:49099/docs/get-started`. It sits behind sign-in. Open it only if the user is already signed in, or take a screenshot they provide. Match its spacing, card style and step flow. Do not enter credentials.

## Process

1. **List the features.** Read the real source: skill/command/agent files, hook config, routes, README. One entry = `{name, description, kind}`. Never invent a feature. Keep the full description text.
2. **Pick a picture per feature.** Order of preference:
   - a curated picture for named features (write it in `FEAT` or `MODS` in the library),
   - else the generic one for its kind: `cmd` (typed `/name` runs the mod), `skill` (request matches, card slides into context), `agent` (Claude hands off, report comes back), `life` (hook events lit on the session timeline), `glyph` (small deterministic icon for list rows).
   - One idea per picture: input, change, result. 640 wide, 120-170 high, at most about 12 shapes, one short label per shape.
3. **Build the page** (single `.html`, no external files):
   - Inline the library. Re-run an inline step (like `build.mjs`) after editing it.
   - Layout from docs-canvas: overview, section nav, one collapsible row per feature (icon, name, one-line description). Open the row to show the full description and the picture. Render the SVG lazily on open.
   - Add a Flow or matrix view when features relate to time or order (which feature acts at which moment).
4. **Verify** in the browser at about 1360 wide: open every row, no console errors, no `undefined` or `NaN` in the SVG string, both themes, animation on and off. Reset the viewport afterwards.

## Requirements

- **Theme:** colours come only from CSS variables (`--accent`, `--ink`, `--mute`, `--line`, `--card`, `--sel`, `--off`, `--warn`). Provide light and dark plus an Auto/Light/Dark button that is remembered. Check text contrast in both themes. Never hard-code a colour in a picture.
- **Animation:** SMIL only (`animate`, `animateMotion`, `animateTransform`). One global Animation toggle. Off renders the same picture static and complete. Default off when `prefers-reduced-motion` is set. Loops are slow (1.5-8 s) and never flash.
- **Static must stand alone:** every picture reads correctly with no motion. Animation adds sequence, it does not carry meaning.
- **Offline:** inline SVG and CSS, no CDN, no fonts to fetch. Works opened from disk and as a hosted Artifact.
- **Accessibility:** each `<svg>` has `role="img"` and an `aria-label`. Rows are real `<details>` or buttons with focus outlines. Text stays 11px or larger in the viewBox.
- **Honest content:** a picture shows what the code does. If a feature cannot be pictured from the source, show the text only and say so.
- **keyTimes:** values must start at 0, end at 1 and never decrease. Check each animation after editing.

## Library API (`references/viz.js`)

`VIZ.life(A,events,name)`, `VIZ.cmd(A,name,desc)`, `VIZ.skill(A,name,desc)`, `VIZ.agent(A,name,desc)`, `VIZ.mod(A,key,info)`, `VIZ.feats(key)`, `VIZ.feat(A,key,i)`, `VIZ.glyph(name,kind)`, `VIZ.flow(A,rows,selKey)`. `A` is the animation flag. Each returns an SVG string. The host page supplies the CSS classes `.viz .box .hot .solid .off .warn .dot .ln .acc .ring .scan .glyph` and text classes `.m .l .b .a .w .s .mono` (copy from the Mods Manager `index.html`).

## Done when

Every feature has a picture or an explicit text-only note, both themes are readable, the animation toggle works, the file opens offline, and the user has the file path.
