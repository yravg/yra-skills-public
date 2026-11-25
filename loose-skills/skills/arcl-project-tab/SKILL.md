---
name: arcl-project-tab
description: Recreate the ARCL Studio Projects home, Projects & documents navigator, and local-or-server project CRUD (templates, versions, import/export) in any app. Use when building a Projects tab, project gallery, industry templates, Spider-style document navigator, storage properties, or porting ARCL project persistence to another program.
---

# ARCL Project Tab

Rebuild the **Projects** workspace from ARCL Studio: a beige gallery of saved work, industry templates, and engine demos, plus a Spider-style **Projects and documents** navigator. Front end and back end stay the same contract so the tab can drop into another program.

**Core rule:** one `ProjectStore` owns every record. The home grid, navigator table, New project modal, and import/export are views of that store. Do not give each surface its own list.

Source of truth: `ARCL Studio.dc.html` (markup) and `arcl-studio.js` (store + templates). Tokens, schemas, and CSS: [reference.md](reference.md). Porting examples: [examples.md](examples.md).

## When to Use

- User wants a Projects tab / home gallery like ARCL
- User wants **Projects and documents** (storages sidebar + CODE/NAME/VER/DATE table)
- User wants industry templates, demos, duplicate / delete / save version
- Porting this tab to another domain (documents, jobs, cases, campaigns)

**Do not use** for Gantt playback (`animating-schedule-playback`) or live solver charts (`animating-live-optimization`).

## Apply to this project first

Map vocabulary before coding. Do not copy ARCL field names if the host app uses different nouns.

| Role | ARCL Studio | Other projects |
|------|-------------|----------------|
| Record | project | document, job, case, campaign, model |
| Payload | `data` (activities, resources, calendars) | the domain document |
| Chip | industry (`OIL & GAS`) | type, client, site, status |
| Score line | `★ best 105 d · 61,500 evals` | last run, last export, unread count — or hide |
| Template | industry starter (turnaround, OR list) | blank + 4–10 realistic starters |
| Demo / library | PSPLIB / engine demos | sample files, fixtures, read-only catalog |
| Storage | `browser://local-storage/…` | `local`, `api://projects`, folder path |
| Version | `ver` + Save version clone | snapshot / revision |

If there is **no optimizer**, drop the best-score line (`○ not optimized yet`). If there is **no library set**, keep My projects + Templates + Demos only.

## Required architecture

```
ProjectStore  (list / get / put / remove / usage)
      |
      +-- serialize(domain) / revive(record.data)
      |
      +------------------+------------------+------------------+
      |                  |                  |                  |
  Home gallery     Navigator modal    New-project modal   Import / export
  (saved cards,    (storages + table  (blank / import /   (.json always;
   templates,       + code/notes)      templates)          extra formats optional)
   demos)
```

1. **One store blob** keyed by record `id`. Browser default: `localStorage` JSON `{ items: { [id]: Record } }`. Server: same shape behind REST (see [reference.md](reference.md)).
2. **Autosave** on every domain edit (debounce ~900 ms). Manual Save is optional and only toasts.
3. **Session** restores last `projectId` + `view` on reload.
4. **Storages** are catalogs, not copies: My projects = store; Templates / Demos / library = built-in or scanned files. Opening a non-my row **creates** a new saved record.
5. **Save version** clones a My-projects row (`new id`, `ver + 1`, same `code`). It does not overwrite.

## Implementation checklist

```
Project tab
- [ ] Tokens + fonts from reference.md (do not invent a new palette)
- [ ] Shell: forest menubar + sidebar; Projects is the active Workspace item
- [ ] Home header: title, usage subtitle, outlined "Projects & documents", outlined Import, solid "+ New project"
- [ ] Saved-project cards (selected = orange border) or dashed empty state
- [ ] Light template cards + dark demo cards
- [ ] New project modal (blank / import / same card grids)
- [ ] Navigator: toolbar, STORAGES, CODE/NAME/VER/DATE, footer fields, Open / Close / Help
- [ ] Storage properties overlay (name, path, default-storage checks)
- [ ] Store: list/get/put/remove + serialize/revive + uid + usageKB
- [ ] CRUD: create, open, duplicate, delete (confirm), save version, rename code
- [ ] Import .json (and host formats); export .json
- [ ] ⌘/Ctrl+O navigator, ⌘/Ctrl+S save, Esc closes top overlay
```

## Surfaces (must all exist)

### 1. Home — Projects

Padding `26px 34px`. Header row: **Projects** 21/700 + mono subtitle (`N saved in this browser · autosaved on every change · K KB used`). Actions right: outlined `▤ Projects & documents`, outlined Import, solid orange `+ New project`.

**Saved cards** — `grid auto-fill minmax(252px, 1fr)`, gap 12. Cream card, 10px radius. Title 14/700 + pill chip. Mono meta (`N activities · M resources · unit d`). Score rust if optimized, muted if not. Footer: `edited {ago}` + ⧉ duplicate + ✕ delete (stop click from opening). Selected / current: border `#D9482B`. Hover: orange border, lift 1px, soft shadow.

**Empty:** dashed cream box, “No saved projects yet”.

**Templates** — heading 15/700 + mono subtitle. Light cards `minmax(228px, 1fr)`: rust icon, name, uppercase industry, 2-line desc, stats.

**Demos** — same grid, **forest** cards, cream title, orange tag, sage body.

### 2. New project modal

Centered 900px cream dialog. Blank + Import as dashed tiles. Then the same template and demo grids. Creating any of them writes a store record and opens it.

### 3. Projects and documents

1080×82vh cream window. Crumb: `FLOATING · {storage.path}`. Toolbar: ⚙ + ✕ ↑ ↓, Scan, **New project** (forest primary), Open / Save version / Delete (disabled unless a My-projects row is selected), Show files, “Show hidden storages”.

Left **STORAGES** 224px (`#EFE7D4`). Active row forest fill + cream text.

Table columns `170px 1fr 56px 118px`: CODE rust mono, NAME, VER, DATE `MM/DD/YY HH:MM`. Selected row **orange fill**, cream text. Click selects; double-click opens.

Footer: editable CODE + VERSION (read-only) + Notes when a My-projects row is selected; otherwise read-only help text. Checkbox “Close window automatically”. Buttons: orange **Open**, outlined Close, outlined Help.

### 4. Storage properties

560px overlay. Name, Path + Select, four default-storage checkboxes. For My projects, “Latest projects to list” chips (All / 5 / 10 / 15 / 20 / custom). OK orange, Cancel / Help outlined.

## Visual contract

| Token | Hex | Use |
|-------|-----|-----|
| Forest | `#14332C` | sidebar, menubar, demo cards, active storage, New project (nav) |
| Beige | `#F2EBDD` | app + modal chrome |
| Cream | `#FBF7EE` | cards, table body, outlined buttons |
| Orange | `#D9482B` | primary actions, selection, focus |
| Rust | `#B4451F` | codes, industry labels, best score |
| Ink | `#16261F` | titles |
| Muted | `#8A8264` | chips, subtitles, dates |

UI font **Space Grotesk**. Meta / codes / chips **IBM Plex Mono**, uppercase + letter-spacing on labels. Focus ring orange. Do not switch to Material / Tailwind defaults.

## Back end contract

Minimum store (browser or HTTP — same methods):

```
list() -> Record[]          // newest updatedAt first
get(id) -> Record | null
put(record) -> Record
remove(id)
usageKB() -> number
```

`Record` and `serialize` / `revive` are in [reference.md](reference.md). Browser key: `{app}.projects.v1`. Session key: `{app}.session.v1`.

When the host already has an API, implement the same methods as `fetch` wrappers. Do not invent a second schema for the navigator.

## Common mistakes

| Excuse | Reality |
|--------|---------|
| "Cards only, skip the navigator" | Both surfaces are the tab |
| "localStorage for home, a different array for the modal" | One store |
| "Opening a template edits the template" | Opening clones into My projects |
| "Save version overwrites" | New id, `ver + 1` |
| "Delete without confirm" | Confirm modal with the name |
| "Tailwind slate / indigo" | Forest / beige / orange only |
| "Sans everywhere" | Mono for codes, chips, stats, dates |

## Red flags — stop and fix

- Home list and navigator list can disagree
- Duplicate / delete on a card also opens the project
- Import does not `revive` into a store record
- Autosave missing; user can lose edits on refresh
- Orange used only on the CTA; selection and codes are grey

## Porting to another stack

- **React / Vue / Svelte:** one store module; home + navigator as views.
- **Existing REST:** map `list/get/put/remove` to `GET/GET/:id/PUT/DELETE`. Keep `data` as an opaque JSON document.
- **Desktop / folder:** My projects = user dir; Templates = bundled; Scan restats the folder.
- **No templates yet:** ship Blank + Import; add 3+ domain templates before calling the tab done.
- **ARCL itself:** match the prototype pixel-for-pixel; do not “clean up” the industrial look.
