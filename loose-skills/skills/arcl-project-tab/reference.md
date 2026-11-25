# ARCL Project Tab — tokens, store, components

Read this when implementing. Hex values are from `ARCL Studio.dc.html`, not the screenshot approximations.

## Tokens

```
--forest:        #14332C
--forest-hover:  #1D4038
--forest-line:   #2C5247
--forest-muted:  #5F7E71
--beige:         #F2EBDD
--cream:         #FBF7EE
--cream-hover:   #F6EFE0
--cream-head:    #F6F0E2
--cream-panel:   #EFE7D4
--paper:         #FFFDF6
--ink:           #16261F
--body:          #3D5247
--body-2:        #5C6B60
--muted:         #8A8264
--sage:          #9DB4A8
--sage-2:        #C9D8CF
--cream-on-dark: #E8DCC8
--orange:        #D9482B
--orange-hover:  #C13E24
--orange-ink:    #FFF3E8
--rust:          #B4451F
--peach:         #F0A48E
--ok:            #2F6B4F
--border:        #E0D6C2
--border-2:      #D8CDB8
--border-3:      #C9BFA6
--hairline:      #EAE0CC
--row-line:      #F2ECDC
--danger-border: #E4C4B2
--overlay:       rgba(22,38,31,.38)
--shadow-card:   0 6px 18px rgba(22,38,31,.10)
--shadow-modal:  0 28px 70px rgba(22,38,31,.45)
```

Fonts (Google): `Space Grotesk` 400/500/600/700 for chrome; `IBM Plex Mono` 400/500/600 for codes, chips, stats, dates.

```css
html, body { margin: 0; background: #F2EBDD; color: #16261F; font-family: 'Space Grotesk', sans-serif; }
button { font-family: 'Space Grotesk', sans-serif; }
input, select, textarea { font-family: 'IBM Plex Mono', monospace; }
input:focus, select:focus, textarea:focus { outline: 2px solid #D9482B; outline-offset: -1px; }
```

Chip / label: 9–10px mono, `letter-spacing: .09em`–`.16em`, `text-transform: uppercase`.

## Record schema

```ts
type Record = {
  id: string              // 'p' + Date.now().toString(36) + random
  name: string
  code?: string           // slug, editable in navigator
  ver?: number            // default 1
  industry: string        // chip text
  createdAt: number
  updatedAt: number
  data: DomainDocument    // serialize(project)
  best?: { mk: number, evals: number, order?: string[] } | null
  warm?: unknown
}

type StoreBlob = { items: Record<string, Record> }
```

ARCL `data` (v2) — replace the inner document when porting:

```
{ v, key, name, unit, defaultCal, calendars, resources, activities,
  dayCost, deadlineWd, penaltyPerDay, currency, note, industry, slotMin,
  refOptimal, refCPM, domain }
```

`serialize` writes a JSON-safe snapshot. `revive` rebuilds runtime objects (calendars, maps). Never persist live class instances.

## Store API

Browser:

```js
const KEY = '{app}.projects.v1'
const SESSION = '{app}.session.v1'
function readAll() { try { return JSON.parse(localStorage.getItem(KEY) || '{}').items || {} } catch { return {} } }
function writeAll(items) { localStorage.setItem(KEY, JSON.stringify({ items })) }
export const store = {
  list() { return Object.values(readAll()).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) },
  get(id) { return readAll()[id] || null },
  put(rec) { const items = readAll(); items[rec.id] = rec; writeAll(items); return rec },
  remove(id) { const items = readAll(); delete items[id]; writeAll(items) },
  usageKB() { try { return Math.round(((localStorage.getItem(KEY) || '').length * 2) / 1024) } catch { return 0 } },
}
export const uid = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
```

HTTP (same methods):

| Method | Route |
|--------|--------|
| list | `GET /api/projects` |
| get | `GET /api/projects/:id` |
| put | `PUT /api/projects/:id` body = Record |
| remove | `DELETE /api/projects/:id` |
| usage | `GET /api/projects/usage` optional |

Keep `data` opaque JSON on the server.

Session: `{ projectId, view }`. Recent-list limit: `{app}.recentN` = `'all'` or a number.

## Lifecycle

```
newRec(p)        → { id: uid(), name, industry, createdAt, updatedAt, data: serialize(p), best: null }
create           → put(newRec) → open(id)
open             → get → revive(data) → set current + session
duplicate        → deep clone, new id, name + ' copy', new timestamps, put
delete           → confirm with name → remove; if current, go home
save version     → clone, new id, ver + 1, same code, put
autosave         → markDirty → debounce 900ms → put(serialize(current))
import           → parse file → revive → create
export           → download serialize(current) as .json
```

Opening a template / demo / library row always `create`s. It never mutates the catalog.

## Storages

```
{ id, label, path, hidden? }
```

ARCL defaults:

| id | label | path |
|----|-------|------|
| my | My projects | `browser://local-storage/{app}.projects.v1` |
| tpl | Industry templates | `built-in://templates/` |
| demo | Demos & benchmarks | `built-in://demos/` |
| library… | host catalogs | folder or API |
| sys | Session & internals | hidden unless “Show hidden storages” |

Navigator row:

```
{ code, name, ver, date, file, notes, kind: 'my'|'tpl'|'demo'|'lib'|'sys', open() }
```

`kind === 'my'` unlocks CODE/Notes edit, Save version, Delete.

## Component map

| Component | Responsibility |
|-----------|----------------|
| `AppShell` | forest menubar + sidebar + beige main |
| `ProjectsHome` | header, saved grid, templates, demos |
| `ProjectCard` | saved record; `selected`, `onOpen`, `onDup`, `onDel` |
| `TemplateCard` | light; icon, industry, desc, meta |
| `DemoCard` | dark forest |
| `NewProjectModal` | blank, import, same card grids |
| `ProjectsNavigator` | toolbar, storages, table, footer |
| `StorageProperties` | name, path, flags, recent-N |
| `ConfirmDelete` | name + Cancel / Delete |
| `ProjectStore` | persistence module |

## Card CSS

Saved (selected when `currentId === rec.id`):

```
background:#FBF7EE; border:1px solid {selected ? #D9482B : #E0D6C2};
border-radius:10px; padding:14px 15px; cursor:pointer;
```

Hover: `border-color:#D9482B; box-shadow:0 6px 18px rgba(22,38,31,.10); transform:translateY(-1px);`

Template: cream, `#E0D6C2` border, radius 9, padding `13px 14px`. Industry `#B4451F`.

Demo: `background:#14332C; color:#E8DCC8; border-radius:9px; padding:13px 14px`. Tag `#D9482B`. Body `#9DB4A8`.

## Navigator CSS

Window: `#F2EBDD`, border `#D8CDB8`, radius 12, 1080×82vh.

Storage active: `background:#14332C; color:#F2EBDD; font-weight:700`.

Row selected: `background:#D9482B; color:#FFF3E8`. Code otherwise `#B4451F`.

Toolbar primary (New project): `background:#14332C; color:#F2EBDD`.

Footer Open: `background:#D9482B; color:#FFF3E8`.

Disabled tools: `opacity:.4; pointer-events:none`.

## Shell (Projects active)

Sidebar 176px, `#14332C`. Section labels 9px mono `#5F7E71`. Active item: lighter forest + 3px orange bar on the left.

Menubar 46px forest. File / Edit / View / … . When a project is open: name, industry chip, save-dot, Live animation, Optimize.

Home empty-app state (“No project open”) is not the Projects tab — it is the no-current-project placeholder. The Projects tab always shows the gallery.

## Keyboard

| Key | Action |
|-----|--------|
| ⌘/Ctrl+O | toggle navigator |
| ⌘/Ctrl+S | save now |
| ⌘/Ctrl+K | command palette (optional) |
| Esc | close top overlay (palette → modal → props → navigator) |
| ↑↓ in navigator | move selection |
| Enter / double-click | open selected row |

## Template factory (ARCL)

Each template is `{ key, name, industry, icon, desc, unit, week, resources, acts, build() }`. `build()` returns a domain document. Port by swapping `acts` / `resources` for that program’s starter payload. Ship at least Blank + 3 domain templates.
