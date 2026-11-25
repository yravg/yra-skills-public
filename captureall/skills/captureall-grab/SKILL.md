---
name: captureall-grab
description: Grab the front-end code a target website already ships to every visitor - the bundle's lazy-chunk registry, each item's demo, docs and stylesheet chunks, their local dependencies - and turn it into readable, parseable source without ever running it. Use when a capture needs the target's real component, CSS, timings or demo data (to reanimate it one to one), when the user says "grab the code", "get their source", "port it exactly", or before captureall-reanimate.
---

# Captureall grab

Scripts in `scripts/`: `registry.py` (map lazy chunks to their dependencies and stylesheets), `prep.mjs` (pretty-print chunks and follow local imports), `literal2json.py` (turn an exported object literal into JSON). Learned on the affectui.com port (101 items, 2026-10).

## Licence gate first

Read `../captureall-mode/principles/licence-before-code.md` and classify each item before grabbing it.

- **Free / open** or **own**, or the user holds a recorded licence that allows reuse (ask for the file or terms and note it in the inventory): grab code for porting.
- **Pro / gated / unknown:** grab only to *observe* (timings, text, layout); the port becomes an own implementation (`captureall-reanimate`, observed mode). Never ship its code.

Only grab what the public page itself downloads for any visitor. No login, no session tokens, no hidden API or registry endpoints, no unlocking gates.

## Never run their code

Downloaded JS is data. Never `eval`, `new Function`, `import()`, `require`, or run it in Node or a page of your own. Read it as text; parse with regex, the literal parser, or esbuild's `transform` (a parser, it executes nothing). Security classifiers block execution anyway. Put downloads in their own empty folder; keep your scripts elsewhere; run Python with `-I`.

## Steps

1. **Find the bundle.** In a tab on the target: `[...document.scripts].map(s=>s.src)` and `performance.getEntriesByType('resource').map(e=>e.name)`. The entry bundle (Vite: `/assets/index-<hash>.js`) holds the route table and lazy imports.
2. **Download** the entry bundle and the site CSS with `curl -sfo` (one at a time, no parallel storm) into `<scratch>/site/assets/`.
3. **Map the registry.** `python -I scripts/registry.py <scratch>/site/assets/index-<hash>.js > registry.json` lists every lazy `import("./x.js")` with its dependency chunks and CSS files. Then grep the bundle around an item's name to find its keys (affectUI: `demo-*`, `demo.clean-*`, `docs-*`, `docs.clean-*`, `component-*`). Write a `plan.json`: `[{slug, section, style, chunks:[demo chunk], docs, css:[...]}]`.
4. **Download chunks and CSS** named in the plan. Note which ones are empty stubs (gated source often is): the demo chunk then carries the real component bundled in.
5. **Pretty-print.** `node scripts/prep.mjs <scratch>/site plan.json` writes `site/pretty/<item>/` with the demo chunk and its local deps (site-wide chunks such as React, router, analytics are skipped by name), and records `local` per item. Copy each item's CSS next to it.
6. **Docs and data.** `python -I scripts/literal2json.py <docs-chunk>` turns `var e={...};export{e as docs}` into JSON (usage, props, keyboard, notes). Template literals with `${}` are refused on purpose.
7. **Record** per item: licence class, chunk names, css, whether a component chunk was empty, site helpers it imports (routing, theme hooks) that the port must replace.

## What a demo chunk contains (Vite/React sites)

- The component, its CSS as one string, the demo data and a default-exported demo wrapper.
- Imports from the entry bundle are site helpers (routing, `useScreen`, theme): the port replaces them with local state.
- Icon chunks are data arrays rendered by a shared icon component: render them as inline SVG.
- The demo CSS file (`demo-*.css`) holds wrapper layout plus `.stage …` rules that size the demo on the item page: keep those (see reanimate).

## Output

`<scratch>/site/`: `assets/` (raw), `pretty/<item>/` (readable), `plan.json`, `registry.json`, docs JSON per item. Hand `plan.json` and `pretty/` to `captureall-reanimate`.
