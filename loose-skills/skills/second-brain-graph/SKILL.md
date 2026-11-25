---
name: second-brain-graph
description: Drop-in "Second Brain" knowledge graph for any web app — a themed, zero-dependency canvas network map of notes/entities (30 templates, force/circle/hex/rings layouts, search, kinds/dataset filters, legend, hub halos, hover dimming) plus a right-hand "Local graph" panel (star around the selected item, grouped link list, Float/Dock into a draggable window) and a Python wikilink-vault backend. Use this whenever the user wants a network graph, knowledge graph, node map, "second brain", Obsidian-style graph view, local/backlink graph, linked-items side panel, or wants to visualise how records (notes, tickets, letters, COPs, WIs, contracts) connect — even if they only say "graph view" or "show relationships".
---

# Second Brain graph

Two coordinated views, extracted from the a notes app project and made generic:

| View | File | What it is |
|---|---|---|
| Full map | `assets/second-brain.js` + `assets/second-brain.css` | Whole-workspace canvas graph with theme templates, layouts, filters, legend, search |
| Local graph pane | `assets/local-graph.js` + `assets/local-graph-pane.html` | Right panel **on every entity tab** (notes, COP, letter, WI, and their vault tabs — 7 instances in the source): star graph around the selected entity, grouped link list, Float ⧉ / Dock |
| Tab shell | `assets/sub-panel.js` | ◀ / ▶ strips: click collapses a side panel, drag resizes it, width persisted per panel |
| Backend | `assets/graph_api.py` | Wikilink vault indexer (graph / local_graph / expand), star builders, cite→hub, FastAPI router |
| Demo | `assets/demo.html` | Both views wired on sample data. Open it in a browser first to see the target UX |

Read `references/ux-spec.md` when you need exact behaviours (thresholds, animations, keyboard). Read `references/data-contract.md` before writing a backend. `references/integration.md` has the wiring checklist for tabs, routing and floats.

## Install (5 steps)

1. Copy `second-brain.js`, `second-brain.css`, `local-graph.js`, `sub-panel.js` into the app's static folder. Load CSS, then both scripts (plain `<script>`; both also work as CommonJS).
2. Give the full map a host element with `position:relative` and a real height (`<div id="graph-host">`). Mount:
   ```js
   const sb = SecondBrain.mount(host, { onOpen, onLayer, onHubs }, {
     storageKey: "myapp.sb", brand: "second brain", tagline: "…",
     kinds: { cop: "COPs", letter: "Letters", wi: "WIs", contract: "Contract", note: "Notes" },
     layers: [{ id: "project", label: "Project" }, { id: "vault", label: "Vault" }],
     hubsLabel: "Contract Article / Exhibit hubs",   // null hides the checkbox
     semanticThemes: ["Canopy"],                      // keep node.color on these themes
   });
   sb.setData({ nodes, edges, layer, projectLabel, hint, hubs }); sb.start();
   ```
   `onLayer(id)` and `onHubs(bool)` mean "reload data, then call setData again". Call `sb.stop()` when the tab hides (saves CPU) and `start()` when it shows.
3. Paste `local-graph-pane.html` once per tab that has a "selected item" (rename ids) — the pane is not a Graph-tab feature, it belongs to every record tab, so the same right panel follows the user from COP to letter to WI. Call `SubPanel.init()` once so the ◀ / ▶ strips collapse and resize. Per-tab table in `references/integration.md`. Add `<div id="float-layer"></div>` once at the end of `<body>`. Create:
   ```js
   const lg = LocalGraph.create({ root: "#wi-graph-block", pane: "#wi-graph-pane", layer: "project",
     isVisible: () => activeTab === "wi", fetchGraph: (focus, layer) => api(`/graph?layer=${layer}&focus=${encodeURIComponent(focus)}`),
     onOpen: openGraphNode, colors: FOLDER_COLORS, defaultTip: "WI · COP · Letter · contract cites" });
   ```
   Call `lg.show(id)` when the user selects an item, `lg.hide()` on deselect, `pause()/resume()` on tab switch.
4. Write **one** `openGraphNode(node)` router and pass it to both views: switch on `node.kind` (`note`→open note, `cop`→select COP, `letter`→select letter, `wi`→select WI, `contract`→open `node.note`). This is what makes the whole app feel interconnected: any node anywhere is one click from its home tab, and that tab's local pane then shows the next hop.
5. Backend: `/graph?layer=&focus=&hubs=`. Without `focus` return the whole layer; with `focus` return a star. Use `WikiVault` for Markdown notes, `star_around` + `merge_live_neighbors` for other entities. `python graph_api.py` runs its self-check.

## Node / edge contract (both views)

```
node: { id, label, title?, kind, group, degree, color?, focus?, via?: "focus"|"out"|"in"|"both",
        note?, cop_id?, letter_id?, wi_id? }        // routing hints for openGraphNode
edge: { source, target }
```
`kind` drives the Kinds filter chips and the pane's link groups. `group` drives colour and legend ("Departments" view = kind label, "Folders" view = group). `degree` drives hub detection and node radius. `via:"in"` nodes (things that reference the focus but the focus does not link back) are drawn smaller, dimmer, on an outer ring. Hubs like a Home/MOC note are omitted from local stars unless `hubs=1`, or they connect everything.

## What must not be lost when porting

- Physics constants (repulsion clamp 2.5, damping .85, VMAX 4, gravity .001, NaN reset) — they are what keep the graph calm. Local pane uses restLength 64 / spread 68 / repulsion 700 and pins the focus at the centre.
- Interaction rules: mousedown on node = drag, release without movement = open; empty drag = pan; wheel zoom .2–3.5 (pane .25–3); dblclick resets; `/` focuses search, Esc clears it or closes the template window.
- Label policy: show when zoom > .55, or hub, or hovered/neighbour, or search match, or "File names" on.
- Theme = CSS variables on `.sb` (`--sb-bg/panel/ink/dim/accent/hub/radius/font/line/accent-soft`) plus `data-pattern` (dots/grid/scanlines/paper/none) and `data-shape` (circle/square). Themes whose name starts with a `semanticThemes` prefix keep each node's own colour; all others colour by group index into the 6-colour palette and paint hubs in `--sb-hub`.
- Persistence: `<storageKey>.theme` and `<storageKey>.prefs` in localStorage (layout, view, kinds, labels, legend, density, linkOpacity, springs, spin, menu, tpl, tplPos).
- Template window floats beside the menu (`.sb.menu-open .sb-tpl-win{right:278px}`), draggable, clamped inside the host.
- Local pane race guard: `show()` increments a sequence and ignores stale fetches.

## Verify

Open `assets/demo.html` from a static server (`python -m http.server` in `assets/`). Console must print `demo self-check ok`. Click COP-012 in the map: right pane shows "4 linked" with groups Links / WI / Letter; Float ⧉ opens a draggable window; Dock returns it. Switch a few templates; reload; theme and layout persist.
