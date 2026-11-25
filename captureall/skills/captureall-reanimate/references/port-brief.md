# Port brief template

Fill the `<…>` parts and save the brief in the scratchpad. Give each agent its item list and checkpoint path in the prompt and point it at this file.

---

# Brief: <target> items as <template name> in <clone>

Repo: `<clone repo path>`. The checkout may be shared with other sessions: create or touch ONLY the files named below.
Scratch inputs: `<scratch>/site/` (call it `SITE`). Licence class of these items: <free/open | own | recorded licence: file> (verbatim port allowed).

## Goal

Each item `<section>/<slug>` gets `<clone path pattern, e.g. src/own/<section>/<slug>.t1.tsx>` that renders exactly what <target URL pattern> shows in its preview stage: same DOM, CSS, motion, text and behaviour. Usage and docs already exist in `<path>`; do not edit them.

Reference port to copy the style of: `<path to the finished reference item>`.

## Inputs per item

- `SITE/plan.json`: `slug`, `section`, `style`, `local` (chunk files; `local[0]` is the demo chunk), `css`.
- `SITE/pretty/<slug>/`: chunks pretty-printed (names still minified) plus the demo CSS file.
- Imports from the entry bundle are site helpers: replace them with local equivalents (local state instead of routing).
- Icon chunks are data arrays rendered by a shared icon component: render them as inline SVG.
- Site stylesheet `SITE/assets/<site css>`: copy rules of any site class a demo uses.
- Shared modules already ported: `<shared folder>` with `map.json` (original export -> readable name). Import from there.

NEVER execute, eval, import or `new Function` downloaded code. Text tools only.

## Output per item

1. Same DOM, class names, attributes, ARIA, CSS text (all rules incl. dark mode, media and container queries, keyframes), timings, easing, state machine, keyboard handling, demo data and text. Copy strings exactly (dashes, quotes, €, →, ⌘, NBSP).
2. Exports: the names the usage snippet imports, every public export of the component module, and `export function Demo()` rendering exactly the chunk's default export, wrapper element and class included.
3. Demo CSS: wrapper rules from the demo CSS file AND the `.stage <descendant>` rules (they size the demo on the item page and apply in the clone's preview too, whose root carries class `stage`). Skip only rules for elements the clone does not have (`.card__preview` thumbnails).
4. Imports: only `react`, `react-dom` for portals, the clone's reduced-motion hook, shared modules.
5. Reduced motion: `const reduced = useReducedMotion()` where the original reads the media query in JS; twin each reduced-motion CSS rule under `<manual switch selector>`.
6. Never name a module constant after a browser global you also use (`const CSS` shadows `CSS.escape`; `const Image`, `const Node`, `const Text` likewise).
7. If an identical open-source copy of the component is vendored at `<path>`, re-export it and port only the demo.

## Check each item

`<single-item build command>` must succeed. Re-read your file against the chunk once: every CSS rule present, every string identical, every state and handler ported. Never run the full build, never write with git, never start servers or browsers. Review your diff for bloat.

## Checkpoint

`<repo>/.checkpoints/<agent-name>.md` in the global format, rewritten after every finished item; `next: finished` at the end.

## Report

One line per item: `<section>/<slug>: done (full port | re-export) | blocked (<reason>)`, plus every place you could not be verbatim and why.
