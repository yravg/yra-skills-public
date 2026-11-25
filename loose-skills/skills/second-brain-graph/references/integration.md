# Integration checklist

## Tabs

Every entity tab is a `.pane` = left list · ◀ strip · main detail · ▶ strip · right Local graph (`assets/local-graph-pane.html`). The source project runs **seven** pane instances, one per tab. Reproduce the table, not just the Graph tab:

| tab | root / pane ids | layer | paneHide | tip | empty text |
|---|---|---|---|---|---|
| vault (notes) | `#note-graph-block` / `#note-tables-pane` | vault | false | Notes · COP · WI · Letter linked to this part | No linked notes, COP, WI, or letters for this part |
| cop | `#cop-graph-block` / `#cop-graph-pane` | project | true | COP · WI · Letter · contract cites | No WI, letter, or contract links for this COP |
| letter | `#letter-graph-block` / `#letter-graph-pane` | project | true | Letter · COP · WI · contract cites | No COP, WI, or contract links for this letter |
| wi | `#wi-graph-block` / `#wi-graph-pane` | project | true | WI · COP · Letter · contract cites | No COP, letter, or contract links for this WI |
| cop-vault | `#cop-vault-graph-block` / `#cop-vault-tables-pane` | vault | false | COP · WI · Letter · contract cites | No linked COP, WI, letters, or notes |
| letter-vault | `#letter-vault-graph-block` / `#letter-vault-tables-pane` | vault | false | Letter · COP · WI · contract cites | No linked COP, WI, letters, or notes |
| wi-vault | `#wi-vault-graph-block` / `#wi-vault-tables-pane` | vault | false | WI · COP · Letter · contract cites | No linked COP, letters, or notes |

`paneHide:true` tabs start with the aside `.hidden` (no selection = no panel, and the ▶ strip hides with it via `.pane:has(> .sub-panel-right.hidden) > .pane-toggle-right`). `paneHide:false` tabs share the aside with other blocks (tables list), so the graph never hides the whole panel.

Wiring per tab (same three hooks every time):
```js
const graphs = { vault: noteGraph, cop: copGraph, letter: letterGraph, wi: wiGraph, "cop-vault": copVaultGraph, "letter-vault": letterVaultGraph, "wi-vault": wiVaultGraph };
function onTabSwitch(tab){ Object.values(graphs).forEach(g => g.pause()); graphs[tab]?.resume(); if (tab === "graph") sb.start(); else sb.stop(); }
function selectWi(id){ …load detail…; wiGraph.show({ id, name: d.number || id, kind: "wi", wi_id: id }); }   // on select
function clearWi(){ wiGraph.hide(); }                                                                       // on deselect / project switch
```
`show()` takes `{name|id}`; `name` is the graph focus id (note name, COP id, letter number). The pane canvas has zero size while its tab is hidden, so `isVisible` must return true only for the active tab.

### Collapse / resize strips (`assets/sub-panel.js`)
- 16px ◀ / ▶ buttons between panels. Click toggles `sidebar-collapsed` / `inspector-collapsed` on the `.pane` (margin slide .18s). Drag ≥4px resizes (`--sub-w`, min 180, max = pane width − 240), width saved in localStorage `<prefix><panel id>`, restored on load. Dragging a collapsed panel expands it first.
- `SubPanel.init({ storagePrefix: "myapp.panel.w." })` once after DOM ready binds every strip; call `SubPanel.bind(pane, btn, side)` for panes injected later.
- `data-default-w` on the aside sets the initial width (280 for local graph, 340 for entity lists).
- Floating the graph (Float ⧉) is independent of collapsing: a floated graph stays visible when the panel is collapsed, and `Dock` re-expands nothing — it only returns the canvas to the aside.

## Routing (`openGraphNode`)
```js
function openGraphNode(n){
  switch (n.kind) {
    case "contract": return openNote(n.note || n.id);
    case "letter":   return selectLetter(n.letter_id || n.id.replace(/^letter:/, ""));
    case "wi":       return selectWi(n.wi_id || n.id.replace(/^wi:/, ""));
    case "cop":      return selectCop((n.cop_id || n.id.replace(/^cop:/, "")).split("#")[0]);
    default:         return openNote(n.note || n.id);
  }
}
```
Each `selectX` should switch tab, load the record, and call that tab's `lg.show(id)`. That closes the loop: map → record → local star → next record.

## Layer reloads
```js
async function loadLayer(layer, hubs){
  const d = await api(`/graph?layer=${layer}&hubs=${hubs?1:0}`);
  sb.setData({ ...d, layer, hubs, projectLabel: currentProject.label, hint: HINTS[layer] });
}
SecondBrain.mount(host, { onOpen: openGraphNode, onLayer: l => loadLayer(l, hubs), onHubs: h => loadLayer(layer, hubs = h) }, opts);
```
Persist `hubs` in sessionStorage if the app has project switching.

## Floats
- `#float-layer` is `position:fixed; inset:0; pointer-events:none; z-index:500`; windows re-enable pointer events. Put it last in `<body>`.
- Other floating windows in the app can reuse `LocalGraph.floats.open(title, bodyNode, srcText, {className,width,height,onClose})`.

## Theming with the host
- The map ignores host theme (it has its own 30 templates). The pane and float use host vars `--bg --panel --panel2 --sidebar --text --dim --accent --accent2 --line --graph-edge --mono`; `second-brain.css` defines fallbacks plus a `prefers-color-scheme` dark set. Override in the host `:root` and delete the fallback block if the host already defines them.
- Semantic colours: keep a `FOLDER_COLORS` map on both sides (backend puts `color` on nodes; pane uses `colors` option as fallback).

## Legacy canvas
If the app already has an older graph canvas in the same host, keep it and give it class `legacy-graph`; `SecondBrain.mount` adds `sb-on` to the host and CSS hides `.sb-on > .legacy-graph`. Lets you ship behind a flag.

## Files to register when done
Copy `demo.html` (or the app's own graph page) to the OS ring per the user's global CLAUDE.md if that rule applies to the project.
