---
name: yravgdcs-project-tab
description: Recreate the yraverageDCS Projects tab (My projects / Templates / Demos gallery, Projects & documents navigator, periodic version snapshots, typed-code delete, tour prompt, guest soft-gate mode) in any app, on the DCS navy/orange IBM Plex look. Use as the standard Projects tab for any server-backed desk app, document control or not - registers, trackers, logs, case desks, schedules. Use when building a Projects home, project gallery, templates/demos shelf, project navigator, cut-off / period versions, or porting DCS project CRUD to another program.
---

# yraverageDCS Project Tab

Rebuild the **Projects** workspace from yraverageDCS: a light gallery of three shelves (My projects, Templates, Demos), a **Projects and documents** navigator, and a version picker for periodic snapshots. Everything reads one REST collection, so the tab drops into another program by swapping the domain payload.

**Core rule:** one `/api/projects` collection owns every record. The home shelves, navigator table, New project modal, and cut-off picker are views of that collection. Do not give a surface its own list.

**Second rule:** a project is a container of **versions** (cut-offs). Rows in the navigator are project x version. Save version clones the latest snapshot forward one period. It never overwrites.

Sources in the DCS repo (`yraveragework/DCS_DocConSystem`):

| Concern | File |
|---------|------|
| Home, New project modal, tour prompt, delete confirm, cut-off picker | `apps/web/src/windows/ProjectsWindow.tsx` |
| Navigator | `apps/web/src/windows/ProjectsNavigatorModal.tsx` |
| Shelf split rule | `apps/web/src/shell/projectGallery.ts` |
| CSS | `apps/web/src/styles.css` (`.projects-*`, `.project-card*`, `.nav-*`, `.dc-btn*`) |
| Tokens | `apps/saas/src/app/tokens.css` |
| Card component + guest gallery | `apps/saas/src/components/ds/project-card.tsx`, `components/project-cards.tsx`, `components/demo-panels.tsx` (`ProjectsHome`) |
| Guest shell, grouped sidebar, cutoff rhythm | `apps/saas/src/components/guest-desk-shell.tsx`, `components/ds/sidebar.tsx` |
| Catalog + nav inventory | `apps/saas/src/lib/demo-seed.ts` (`DEMO_PROJECTS`, `PE_DESK_NAV`) |
| Back end | `apps/api/app/routers/projects.py` |

Tokens, CSS, schemas, routes: [reference.md](reference.md). Porting to non-document domains: [examples.md](examples.md).

## When to use

- A Projects tab / project home for any desk-style app (registers, trackers, logs, queues)
- Templates + Demos shelves with clone-on-open
- A navigator window (storages + CODE / NAME / INDUSTRY / VERSION / DATE table)
- Periodic snapshots (weekly cut-off, monthly close, sprint, reporting period)
- A read-only guest demo that soft-gates writes to sign-up

**Do not use** for the ARCL beige/forest look (use `arcl-project-tab`), Gantt playback (`animating-schedule-playback`), or solver charts (`animating-live-optimization`).

## Map vocabulary first

Keep the structure. Rename the nouns to the host domain.

| Role | yraverageDCS | Other programs |
|------|--------------|----------------|
| Record | project (`PROJ-A`) | register, tracker, case book, site, contract |
| Payload | documents + sources + workflow | the host's rows (items, tickets, activities, invoices) |
| Version | cut-off, `Week N`, a Friday | period close, sprint, month-end, baseline, issue |
| Version rule | must be a Friday; Save version = next Friday | host period rule; next period after the source |
| Chip (code) | `PROJ-A`, orange mono | same: short unique CODE |
| Industry line | `OIL & GAS`, `EPCI · ACTIVE` | type, client, site, status |
| Card meta | `42 documents · 1 cut-off · Week 1 Fri 03-Jan-26` | `{n} {items} · {m} {versions} · {latest version}` |
| Second meta | `location · contract_no` | location, owner, contract, or hide |
| Template | Blank, Tutorial (`TUT4`) | Blank + 2-6 starters |
| Demo | sample registers (`DEMO-WHP`, `DEMO-PORT` ...) | sample datasets across the host's industries |
| Tutorial | `TUT*` code or "tutorial" in name, orange inset bar | same, if the host has a guided tour |

If the host has **no periods**, keep one implicit version per project and hide the VERSION column, cut-off picker, and Save version. Everything else stays.

## Required architecture

```
REST /api/projects  (list / create{from_template} / get / patch / delete{code} / duplicate)
REST /api/projects/:id/cutoffs, /api/cutoffs/:id (patch), /api/cutoffs/:id/save-version
        |
        +-- Project.kind: my | demo | catalog
        |
   +----+------------------+-------------------+-----------------+-------------------+
   |                       |                   |                 |                   |
 Home shelves        Navigator modal     New project modal   Cut-off picker    Guest /demo
 (My / Templates /   (storages + rows    (catalog cards +    (topbar select +  (static catalog,
  Demos)              per version)        Import JSON)        Properties +      writes soft-gate)
                                                              Save version)
```

1. **Kinds decide shelves.** `my` = My projects. `demo` = cloned catalog copies and tutorials, shown under Demos. `catalog` = hidden clone sources (never listed, never deleted). Client split: `isDemoGalleryProject` = `kind === 'demo'` or tutorial or code `DEMO` / `DEMO-*`.
2. **Templates and demos clone.** `POST /api/projects { from_template: 'blank' | 'tutorial' | 'demo' }`. The catalog row is never edited. Tutorial/demo clones get `kind = 'demo'`. Blank creates `kind = 'my'` with one empty version (`Week 1`, next Friday).
3. **Codes are unique.** Server `unique_project_code(base)` suffixes on collision. CODE is editable in the navigator.
4. **Save version** = `POST /api/cutoffs/:id/save-version` → clone snapshot, `ver + 1`, date = next period after source, label `Week {ver+1}`. Flush any unsaved client state (DCS: the PBI template) before cloning, and never let a flush error block the clone.
5. **Delete is guarded.** Typed-code confirm on the client. Server: admin only, `body.code` must match, refuse `catalog`, refuse the last `my` project, write an audit row.
6. **Session.** Server remembers `last_project_id` + `last_cutoff_id` per user; fall back to first `my`, then first `demo`.
7. **Every write re-lists.** After create / duplicate / patch / delete / save version, call `load()` (GET list) so home and navigator agree.

## Implementation checklist

```
Project tab
- [ ] Tokens + IBM Plex Sans/Mono from reference.md (no new palette)
- [ ] Shell: navy 230px sidebar, orange 32px brand mark, grouped nav; WORKSPACE = Projects · Templates · Demos · Cut-off
- [ ] Topbar: title + cut-off picker (select · Properties · Save version)
- [ ] Home header: "Projects" + mono subtitle; ghost "Projects & documents", ghost Import, primary "+ New project"
- [ ] My projects shelf (flagship pinned first, then code A-Z) or dashed empty state
- [ ] Templates shelf (light #F7F8F6 cards) and Demos shelf (navy cards + catalog demo cards)
- [ ] Card: name, industry line, orange code chip, meta, second meta, "edited {ago}" + Duplicate / Delete links
- [ ] New project modal: catalog cards + Import JSON card
- [ ] Tour prompt on opening a tutorial/demo (Tour general / Tour for DC x Watch / Practise, Just open)
- [ ] Delete confirm: type the code; Delete disabled until it matches
- [ ] Navigator: crumb, storages (My projects / Templates / Demos), CODE/NAME/INDUSTRY/CUT-OFF/DATE, footer CODE + VER + Notes, Save version / Delete / Open / Close / Help
- [ ] Cut-off Properties dialog: label, date (period rule enforced), notes; changing the date does not clone
- [ ] Back end routes + kinds + guards from reference.md
- [ ] Guest mode (optional): static catalog, soft-gate writes, 403 demo_readonly, isolated storage keys
```

## Surfaces (must all exist)

### 1. Home - Projects

Padding `8px 4px 24px` inside the page viewport (`24px 28px`). Header: **Projects** h2, mono subtitle `{mine} my · {demos} demos · cut-offs are Friday snapshots · open {CODE}` (or `none open`). Actions right: ghost `Projects & documents`, ghost `Import`, primary `+ New project`.

Shelf headings `My projects`, `Templates`, `Demos` (h3). Demos gets a one-line mono lead: what the samples are.

Grid `repeat(auto-fill, minmax(252px, 1fr))`, gap 12, margin-bottom 22.

**Saved card**: white, 1px `--border`, radius 10, padding 14. Top row: name (bold) + industry line (mono 10.5 uppercase dim) on the left, code chip (mono 11 orange) on the right. Meta 12.5 dim. Footer: `edited {ago}` left, `Duplicate` teal link + `Delete` red link right; both `stopPropagation`. Hover: orange border. Selected (open project): orange border + `0 0 0 1px` orange ring. Tutorial: `inset 3px 0 0` orange.

**Template card**: `#F7F8F6`. **Demo card**: navy `#101B24`, text `#E8EEF0`, meta `#9AA8B0`, chip `#F0A060`, industry `#7EC8C8`, links teal `#7EC8C8` / red `#E08A8A`.

**Empty**: dashed 1px border, radius 10, padding 28, "No saved projects yet. Create a blank project or open a Demo."

### 2. New project modal

`min(1080px, 94vw)` white dialog, radius 10, padding 18, max-height 86vh. Lead: "Opening Tutorial or Demo clones the catalog into Demos. The original catalog is not edited." Same card grid: one card per catalog entry + a label card **Import JSON** with a file input. Import accepts `{ code, name, location, industry, contract_no, notes, cutoff_date }` and creates a blank project. Close = ghost.

### 3. Tour prompt

Opening a tutorial or a freshly cloned demo asks: **Take a tour of {CODE}?** Two groups, **Tour general** and **Tour for DC** (rename to the host's roles), each with primary **Watch** and default **Practise**. Ghost **Just open** at the bottom. Hosts with no tour skip this dialog.

### 4. Projects and documents (navigator)

Same dialog size. Crumb mono 11: `PROJECTS · {STORAGE}`. Body: bordered flex, min-height 42vh.

Left **storages** 200px `#F4F5F3`: My projects, Templates, Demos. Active = navy fill, white text.

Table `data nav-table`: **CODE** (mono) · **NAME** · **INDUSTRY** · **CUT-OFF** (version label) · **DATE** (formatted period date). My projects = one row per project x version. Demos = live demo rows + catalog rows. Templates = catalog rows only. Selected row = orange fill, white text. Click selects; double-click opens.

Footer: when a real row is selected, editable **CODE**, read-only **VER**, **Notes** (saves on blur via PATCH project code + PATCH cutoff notes). Otherwise help text: `Open {CODE} · {label}. Select a My-projects row to edit code and notes.` Actions: ghost **Save version**, danger **Delete**, primary **Open**, ghost **Close**, ghost **Help**. Save version / Delete disabled for catalog rows. Opening a catalog row calls create-from-template, then closes.

### 5. Cut-off picker (topbar)

Label `Cut-off` + select (`{label} · {Fri date}`, min-width 220, height 32) + compact ghost **Properties** + compact ghost **Save version**. Properties dialog (440px): Label, date input, Notes; lead "Date must be a Friday. Changing the date does not clone data." Cancel ghost, Save primary.

### 6. Delete confirm

440px dialog: **Delete {name}?** "Type the project code **{CODE}** to confirm. This removes every Friday cut-off snapshot." Input with the code as placeholder. Cancel ghost, Delete danger, disabled until the input equals the code.

## Visual contract

| Token | Hex | Use |
|-------|-----|-----|
| Accent | `#E8590C` | primary buttons, code chips, selection border, selected nav row, brand mark |
| Accent hover | `#C45A12` / `#D14E08` | primary hover |
| Teal | `#0B6E85` | links (Duplicate), issued status, chart-1 |
| Sidebar / demo | `#101B24` | sidebar, demo cards, active storage |
| Page | `#EFF1EE` | app background |
| Panel | `#FFFFFF` | cards, dialogs, tables |
| Template | `#F7F8F6` | template cards |
| Text | `#18222C` | titles |
| Dim | `#7A8894` | meta, subtitles, industry |
| Border | `#E1E5E0` | cards, tables |
| Danger | `#AF2E2E` | delete, conflict |

Fonts: **IBM Plex Sans** for UI, **IBM Plex Mono** for codes, chips, industry lines, subtitles, crumbs, dates. Radius 5 on buttons and inputs, 10 on cards and dialogs. Focus ring `0 0 0 2px rgba(232,89,12,.2)`. Dense tables at 32px rows. Do not switch to Tailwind slate / indigo or shadcn defaults.

Marketing pages may use steel-blue `#1d4ed8`. Never paint it on desk CTAs, card selection, or table actions.

## Guest / Instant Try mode (optional)

- Route `/demo`, no auth. Static catalog (`DEMO_PROJECTS`: 1 mine, 1 template, 6 demos). Not a workspace; does not count toward plan quotas.
- Home header: default **Invite**, primary **+ New project**, compact **Open Demos →**. Duplicate on cards soft-gates.
- **Soft gate:** every write button calls `softGateToSignup(action)` → `/sign-up?next=/demo`. Server `POST /api/demo*` returns **403 `demo_readonly`**. Reads stay free.
- Demo local storage uses its own prefix (`dcs.desktop.demo.`) and never touches production keys.
- Public seeds use neutral codes only. Keep a forbidden list of real client/project names and test that the public blob contains none of them.
- Banner: `Guest demo · resets daily`.

## Common mistakes

| Excuse | Reality |
|--------|---------|
| "Cards only, skip the navigator" | Both surfaces are the tab |
| "Navigator lists projects" | It lists project x version rows |
| "Opening a template edits it" | Opening clones; catalog rows are `kind='catalog'` and read-only |
| "Save version overwrites the snapshot" | New cut-off, `ver + 1`, next period |
| "Delete with a yes/no confirm" | Typed code, admin only, not the last project, audited |
| "Demo cards look like saved cards" | Demo = navy, template = `#F7F8F6`, tutorial = orange inset |
| "Sans for codes" | Mono for codes, chips, dates, subtitles |
| "Guest writes just fail silently" | Client soft-gates to sign-up; server returns 403 `demo_readonly` |

## Red flags - stop and fix

- Home and navigator can disagree after a write (missing `load()`)
- Duplicate / Delete on a card also opens the project
- Catalog rows can be deleted or edited
- Save version picks a date that breaks the period rule
- Cut-off date change clones data
- Orange only on the CTA; codes and selection are grey
- Real client names in a public demo seed

## Porting to another stack

- **Same REST (FastAPI / Next route handlers):** copy routes and guards from reference.md; keep `kind` and `unique_project_code`.
- **React / Vue / Svelte:** one `api.projects()` loader in the tab root; home, navigator, and modal get `rows` + `load`.
- **No backend yet:** implement the same methods over `localStorage` (see examples.md) so a later REST swap changes one module.
- **Other domains:** examples.md shows the rename table for a procurement tracker, an HSE incident log, and a construction schedule.
