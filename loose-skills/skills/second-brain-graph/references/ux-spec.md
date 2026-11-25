# UX spec — Second Brain map and Local graph pane

Everything a port must reproduce. Numbers are the shipped values.

## 1. Full map (`SecondBrain`)

### Chrome
- Top bar 48px: `<theme name> second brain · <projectLabel> · <tagline>`; right: status `N nodes · M links[ · K match]`, buttons **template**, **menu**.
- Menu (right, 252px, hidden state persisted): search input, **Layout** chips Force/Circle/Hex/Rings, **View** chips Departments/Folders, **Kinds** chips (one per kind present, toggle), **Dataset** chips (one per layer) + hubs checkbox (hidden on layers in `hubsHiddenOnLayers`), sliders Density .5–2, Link opacity .03–1, Link springs .002–.06, Ring spin 0–1 (only when layout=rings), checkbox **File names**.
- Template window: floating aside, 2-column grid of 30 swatch buttons, sits at `right:278px` when menu open else `right:14px`; draggable by title bar, position persisted (`tplPos`) and clamped inside host; × or Esc closes.
- Legend (bottom-left, toggle "✦ legend"): head = current view name + hint, rows = colour dot, group name, count, sorted by count desc.
- Tip line (bottom-left): hover shows `label — title · N links`, else `<hint> · Drag nodes · click to open · scroll to zoom · / to search`.

### Rendering
- Canvas sized to host × devicePixelRatio; ResizeObserver on host.
- Background pattern per theme: dots (28px grid, 1px dots ink@.12), grid (lines ink@.07), scanlines (every 3px ink@.06), paper (900 pseudo-random 1px specks ink@.035), none. Pattern pans with the view.
- Edges: colour ink at `linkOpacity`; when hovering, edges of the hovered node turn accent @ .9, width `1.8/zoom+.6`; others drop to `linkOpacity*.25`. Search dims edges whose ends do not both match.
- Nodes: radius `node.r || 5`, hubs ×1.15 with halo (r+7 @ .18). Hub = degree ≥ max(4, .6 × maxDegree). Non-semantic themes paint hubs in `--sb-hub`. Square shape themes fill rects.
- Dim = .18 alpha for non-neighbours while hovering, or non-matches while searching. Focus/match ring: ink stroke r+2.
- Labels: `11/max(zoom,.8)px` theme font, bold for hover/hub, below node; policy in SKILL.md.

### Layouts
- **force**: fresh = ring of radius `260·density·√(N/60)` + jitter 60. Repulsion `2200·density²/d²` clamped 2.5 (d² floor 25); springs `(d−120·density)·springs`; gravity −.001·pos; damping .85; VMAX 4; dragged node frozen; NaN → random reset.
- **circle**: sorted by group then degree desc, radius spread×1.15.
- **hex**: cell 34·density, cols ⌈√(1.3N)⌉, odd rows offset half cell, row pitch .87.
- **rings**: top min(8, ⌈.06N⌉) by degree → inner ring .22·spread; degree ≥3 → .62; rest → 1.05. Spin: angle += spin·.004 per frame, inner ring 1.6× faster. Non-force layouts ease to target at .12/frame.

### Interaction
- Drag node (mousedown+move) / click node (mousedown+up without move → `onOpen`), pan on empty space, wheel ×1.12 / ×.89 clamped .2–3.5, dblclick reset zoom+pan.
- `/` focuses search unless already typing; Esc clears search (blur) or closes template window.
- Layout chip → relayout fresh; View chip → recolour + relayout; Kind chip → filter nodes+edges; Layer chip → `onLayer`; hubs checkbox → `onHubs`; Density slider relayouts non-force.

## 2. Local graph pane (`LocalGraph`)

- Header: "Local graph", meta `N linked` / `isolated`, **Float ⧉**.
- Canvas 196px tall in a rounded box; below it the link list grouped in order note→cop→wi→letter→contract with uppercase group headings; each row `<a data-id data-kind data-cop data-letter data-wi data-note>`; empty state text configurable.
- Tip below list: default e.g. `WI · COP · Letter · contract cites`; hover shows node id.
- Star layout: focus pinned at (0,0) r 9 with accent ring; others placed evenly on ring radius 68 (via:"in" on 1.12× ring, r 4.5, alpha .42); others r `5.5+min(5,.4·degree)`. Labels always on (10px), prefix `Table|Letter|Exhibit X — ` stripped, cut to 22 chars.
- Physics: rest 64, repulsion 700, spring .01, same damping/VMAX/gravity as the map. Zoom .25–3.
- Hover dims non-neighbours to .22 and highlights incident edges in accent.
- Click node (not focus) or link row → `onOpen(node)`.
- **Float**: stops docked engine, hides docked block, shows "Graph is floating · Dock" bar, opens `.float-win.float-graph` (480×440, min 360×280) in `#float-layer` with its own canvas+links, draggable header, CSS `resize:both`, z-index bump on mousedown, ✕ or **Dock** returns to pane and re-applies the last graph. New `show()` while floating updates the window and its title `Local graph — <focus>`.
- `pause()` on tab leave, `resume()` on tab enter (float keeps running).
- Stale fetch guard: sequence counter per `show()`.

## 3. Theme table (name → bg, panel, ink, dim, accent, hub, font, radius, pattern, shape)
Canopy · Canopy paper · Terminal · Amber CRT · Pixel arcade · Game Boy · Vaporwave · Synthwave · Brutalist · Swiss · Mono ink · Mono chalk · Newsprint · Blueprint · Solarized dark · Solarized light · Nord · Dracula · Gruvbox · Tokyo night · Sakura · Forest · Deep ocean · Dusk · Lavender · Manuscript · Cyber yellow · Bauhaus · Neon noir · Candy pop. Full values live in `assets/second-brain.js` `THEMES`.
