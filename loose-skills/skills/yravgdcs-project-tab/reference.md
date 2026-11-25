# yraverageDCS Project Tab - tokens, CSS, schema, routes

Read this when implementing. Values come from `apps/saas/src/app/tokens.css` and `apps/web/src/styles.css` in the DCS repo.

## Tokens

```css
:root {
  --accent: #E8590C;
  --accent-hover: #C45A12;
  --accent-teal: #0B6E85;
  --accent-ring: rgba(232, 89, 12, 0.2);
  --sidebar: #101B24;
  --sidebar-fg: #b9c4cc;
  --sidebar-fg-strong: #f2f5f7;
  --sidebar-fg-sub: #6e7e8b;
  --sidebar-active-fg: #ffb07a;
  --sidebar-active-bg: rgba(232, 89, 12, 0.18);
  --sidebar-hover-bg: rgba(255, 255, 255, 0.04);
  --sidebar-rule: rgba(255, 255, 255, 0.1);
  --bg: #EFF1EE;
  --bg-elevated: #ffffff;
  --text: #18222C;
  --text-dim: #7A8894;
  --ink-faint: #98a4ae;
  --border: #E1E5E0;
  --border-soft: #EEF0ED;
  --input-border: #d4dad3;
  --surface-template: #f7f8f6;
  --surface-sunken: #f2f4f1;
  --danger: #AF2E2E;
  --warn: #C45A12;
  --ok: #1F7A38;
  --andon-red: #AF2E2E;
  --andon-amber: #C45A12;
  --row-height: 32px;
  --topbar-height: 48px;          /* 58px inside .ds-root */
  --sidebar-width: 230px;
  --sidebar-width-collapsed: 56px;
  --brand-mark: 32px;
  --nav-item-height: 36px;
  --control-height: 32px;
  --projects-min-col: 252px;
  --viewport-padding: 24px 28px;
  --radius-sm: 5px;
  --radius-lg: 10px;
  --shadow-modal: 0 20px 50px rgba(20, 40, 70, 0.12);
  --backdrop: rgba(13, 20, 27, 0.38);
  --ring-selected: 0 0 0 1px var(--accent);
  --inset-tutorial: inset 3px 0 0 var(--accent);
  --focus-ring: 0 0 0 2px var(--accent-ring);
  --font-sans: "IBM Plex Sans", "Segoe UI", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

Type scale: h1 16/600 (`-0.01em`), title 14, card 13.5, body 13, cell 12.5, meta 11.5, section label 10 mono uppercase `0.1em`.

Status chips (for payload rows, not the tab itself): draft `#eef0ed/#43515e`, review `#fff3e8/#c45a12`, approved `#e8f5ec/#1f7a38`, issued `#e6f4f7/#0b6e85`, rejected `#fbeaea/#af2e2e`, superseded `#f2f4f1/#7a8894`.

## Tab CSS (drop-in)

```css
.projects-home { padding: 8px 4px 24px; }
.projects-home-head { display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 16px; }
.projects-home h2, .projects-home h3 { margin: 0 0 8px; }
.projects-sub { color: var(--text-dim); font-size: 12.5px; margin: 0 0 12px; font-family: var(--font-mono); }
.projects-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(252px, 1fr)); gap: 12px; margin-bottom: 22px; }
.project-card { text-align: left; background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 14px; color: inherit; }
.project-card:hover { border-color: var(--accent); }
.project-card.selected { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.project-card.tutorial { box-shadow: inset 3px 0 0 var(--accent); }
.project-card.template { background: #F7F8F6; }
.project-card.demo { background: #101B24; color: #E8EEF0; }
.project-card.demo .project-meta, .project-card.demo .project-card-foot { color: #9AA8B0; }
.project-card.demo .project-chip { color: #F0A060; }
.project-card.demo .project-industry { color: #7EC8C8; }
.project-card.demo .linkish { color: #7EC8C8; }
.project-card.demo .linkish.danger { color: #E08A8A; }
.project-card-top { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; }
.project-chip { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.04em; color: var(--accent); }
.project-industry { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.04em; color: var(--text-dim); text-transform: uppercase; margin-top: 4px; }
.project-meta { font-size: 12.5px; color: var(--text-dim); margin: 8px 0 10px; }
.project-card-foot { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-dim); }
.projects-empty { border: 1px dashed var(--border); padding: 28px; border-radius: 10px; color: var(--text-dim); }
.linkish { background: none; border: 0; color: var(--accent-teal); padding: 0; font: inherit; }
.linkish.danger { color: var(--danger); }

.projects-modal, .projects-navigator { background: #fff; border-radius: 10px; padding: 18px; width: min(1080px, 94vw); max-height: 86vh; overflow: auto; }
.projects-navigator .nav-body { display: flex; min-height: 42vh; border: 1px solid var(--border); }
.nav-crumb { font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); margin-bottom: 8px; }
.nav-storages { width: 200px; background: #F4F5F3; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
.nav-storages button { text-align: left; border: 0; background: transparent; padding: 8px 10px; border-radius: 6px; color: inherit; }
.nav-storages button.active { background: var(--sidebar); color: #fff; }
.nav-table { flex: 1; margin: 0; }
.nav-table tr.selected td { background: var(--accent); color: #fff; }
.nav-foot { display: flex; flex-wrap: wrap; gap: 10px; align-items: flex-end; margin-top: 12px; }
.nav-foot label { display: flex; flex-direction: column; font-size: 11px; color: var(--text-dim); gap: 4px; }
.nav-foot .grow { flex: 1; min-width: 180px; }
.row-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }

.cutoff-picker { display: flex; align-items: flex-end; gap: 8px; margin-left: 12px; flex-shrink: 0; }
.cutoff-picker label { display: flex; flex-direction: column; font-size: 11px; color: var(--text-dim); gap: 3px; }
.cutoff-picker select { min-width: 220px; height: 32px; padding: 0 10px; border: 1px solid var(--border); border-radius: 5px; background: #fff; color: var(--text); font-size: 12.5px; }

.overlay { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; background: rgba(20, 28, 40, 0.45); padding: 24px; }
.dialog { width: min(440px, 100%); background: #fff; border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; box-shadow: 0 12px 40px rgba(20, 28, 40, 0.18); }
.dialog h3 { margin: 0 0 8px; font-size: 16px; }
.dialog p { margin: 0 0 16px; font-size: 13px; color: var(--text-dim); line-height: 1.45; }
.dialog.tour { width: min(520px, 100%); }
.tour-group { border-top: 1px solid var(--border-soft); padding: 10px 0 8px; }

.dc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: 1px solid var(--border); background: #fff; color: var(--text); padding: 8px 15px; border-radius: 5px; font-size: 13px; font-weight: 600; line-height: 1.2; }
.dc-btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }
.dc-btn.primary:hover { background: #D14E08; }
.dc-btn.ghost:hover { background: #F2F4F1; }
.dc-btn.danger { background: var(--danger); border-color: var(--danger); color: #fff; }
.dc-btn.danger:hover { background: #8F2424; }
.dc-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.dc-btn.compact { height: 32px; padding: 0 10px; font-size: 12px; gap: 5px; }
```

DCS names the overlay/dialog `settings-leave-overlay` / `settings-leave-dialog`; the short names above are the same rules.

## Shell

Sidebar 230px (`56px` collapsed), `--sidebar` navy. Brand row: 32px orange square mark with 2-letter initials (`DC`), title `Document Control`, sub line `{CODE} · COD {date}`; collapse toggle right. Groups separated by `--sidebar-rule` hairlines. Nav item 13px/500, padding `9px 11px`, radius 5; active = `--sidebar-active-bg` + `--sidebar-active-fg`; counts are orange mono pills. Footer: acting-as (`Admin (all steps)`, `Lv 4`) and a small status light (`ANDON AMBER`). Never make the status light the hero.

Desk nav inventory (rename per host):

```
WORKSPACE  Projects · Templates · Demos · Cut-off
DOCUMENTS  Document Log · Doc detail · Import Center · Andon
WORKFLOW   Approval queue · Status / DBS
INSIGHT    Dashboard GEN · Dashboard PBI · Reports · Pivot · Reminder
SYSTEMS    EDMS log · Files · Audit · Members · Settings · Export · Help / Tour · CDE / ISO 19650
```

The WORKSPACE group is the Projects tab. Templates and Demos nav items open the same home with one shelf (`kinds=['template']` / `['demo']`, heading changed).

Topbar 48px (58px in `.ds-root`): page title, period date (`COD 03-Jan-26`), cut-off picker, tools, primary action.

## Types

```ts
type ProjectKind = 'my' | 'demo' | 'catalog'

type CutoffSummary = {          // a version
  id: number
  project_id: number
  label: string                 // "Week 3"
  cutoff_date: string           // ISO; must satisfy the period rule
  ver: number
  notes: string
  document_count: number
}

type ProjectListItem = {
  id: number
  code: string                  // unique, uppercase
  name: string
  location: string
  industry?: string
  contract_no: string
  kind?: ProjectKind
  notes?: string
  cutoffs: CutoffSummary[]
  document_count: number
  updated_at?: string | null
}

type WorkspaceSession = { project_id: number; cutoff_id: number; project: ProjectListItem; cutoff: CutoffSummary }

type TemplateCard = {           // client catalog; server holds the real rows
  key: 'blank' | 'tutorial' | 'demo'
  code: string                  // NEW | TUT4 | DEMO
  name: string
  desc: string
  kind: 'templates' | 'demos'
  industry?: string
}
```

Guest card shape (`DemoProjectCard`): `{ code, title, industry, status?, docCount, cutoffCount, cutoff, kind: 'mine'|'template'|'demo', location?, tag? }`. Meta: templates `"{n} starter docs · {tag}"`, others `"{n} documents · {k} cut-off · Fri {date}"` (`blank cut-off` when zero).

## Routes

| Method | Route | Role | Notes |
|--------|-------|------|-------|
| GET | `/api/projects` | any user | `kind in ('my','demo')`, `updated_at desc, id desc` |
| POST | `/api/projects` | controller+ | `{ from_template?, code?, name?, location?, industry?, contract_no?, notes?, cutoff_date? }` |
| GET | `/api/projects/:id` | any user | |
| PATCH | `/api/projects/:id` | controller+ | code, name, meta |
| DELETE | `/api/projects/:id` | admin | body `{ code }`; refuse catalog, mismatch, last `my`; audit |
| POST | `/api/projects/:id/duplicate` | controller+ | clone tree, `unique_project_code`, name + ` copy`, `kind='my'` |
| GET | `/api/projects/:id/cutoffs` | any user | versions |
| POST | `/api/projects/:id/cutoffs` | controller+ | empty version |
| PATCH | `/api/cutoffs/:id` | controller+ | label, notes, date (period rule, no clone) |
| DELETE | `/api/cutoffs/:id` | controller+ | |
| POST | `/api/cutoffs/:id/save-version` | controller+ | `{ cutoff_date?, label?, notes? }`; clone, `ver+1`, default next period; unique-date race → 409 |
| GET | `/api/session` | any user | last project + cut-off, fallbacks |

Create logic:

```
template = (from_template || 'blank').lower()
ensure_catalog_projects()                     # seeds catalog rows once
if template in (tutorial, demo):
    src = catalog row (TUT4 | DEMO)
    dest = clone_catalog(src, code=unique(code or src.code), name=name or src.name + ' copy')
    dest.kind = 'demo'; overlay location/industry/contract/notes from body
else:
    project(kind='my', code=unique(code or 'NEW'), name or 'New project', default workflow + calendar)
    first version: label 'Week 1', date = body.cutoff_date (must be Friday) or next Friday
```

Errors return 400 with a plain message (`Date must be a Friday`, `Confirmation code does not match`, `Cannot delete the last remaining project`). The client shows it in an `.error` line; it never swallows it.

## Client lifecycle

```
load            → api.projects() → setRows
open(p)         → latest version (max cutoff_date) → onOpen(project_id, cutoff_id); no version → error
requestOpen(p)  → tutorial ? tour prompt : open
createFrom(k)   → POST {from_template:k} → load → tutorial/demo ? tour prompt : open
duplicate       → POST /duplicate → load → open copy
delete          → confirm(typed code) → DELETE {code} → load
saveVersion     → flush client state (ignore 403) → POST save-version → switch to new cut-off → refresh
navigator meta  → blur Notes → PATCH project code (if changed) + PATCH cutoff notes → load
import JSON     → parse → POST blank with fields → open
```

My-projects order: pinned flagship first, then code A-Z. Shelf split: `isDemoGalleryProject(p) = kind==='demo' || isTutorial(p) || code==='DEMO' || code.startsWith('DEMO-')`; `isTutorial(p) = code.startsWith('TUT') || /tutorial/i.test(name)`.

`ago(iso)`: `just now`, `{m} min ago`, `{h} h ago` (< 48 h), `{d} d ago`.

## Guest mode contract

| Piece | Value |
|-------|-------|
| Route | `/demo?view={nav id}&project={CODE}` |
| Banner | `Guest demo · resets daily` |
| Sign-up | `/sign-up?next=/demo` |
| Soft-gated actions | Save, Export, Invite, Create, New project, Save version, Import commit, Settings writes, Approval writes, conflict resolve |
| Free actions | navigate, filter, inspectors, dry-run import, dashboards, reports, legend, tour |
| Server | `POST /api/demo*` → `403 { error: 'demo_readonly' }` |
| Storage | prefix `dcs.desktop.demo.`; test that demo and production keys never overlap |
| Seeds | neutral codes only (`PROJ-A`, `DEMO-*`, `DOC-001`); forbidden-name test over the public blob |

## Catalog shipped in DCS

| Code | Name | Shelf | Industry | Notes |
|------|------|-------|----------|-------|
| NEW | Blank project | Templates | - | one empty cut-off, next Friday |
| TUT4 | Tutorial - Weekly cut-off | Templates | Oil & Gas | four Friday snapshots (weeks 1, 5, 9, 13) |
| DEMO | Demo - Generic wellhead | Demos | Oil & Gas | richer sample register, same columns as live work |
| PROJ-A | My sample project | My projects (guest) | EPCI · ACTIVE | 42 docs |
| DEMO-INFRA | Blank / Infrastructure | Templates (guest) | Infrastructure | 18 starter docs, tag NEW |
| DEMO-WHP | Wellhead Platform Demo | Demos | Oil & Gas | 128 docs, Offshore |
| DEMO-PORT | Port Expansion Demo | Demos | Infrastructure | 96 docs, 2 cut-offs, Coastal |
| DEMO-PWR | Power Train Demo | Demos | Power | 74 docs |
| DEMO-PIPE | Pipeline Corridor Demo | Demos | Oil & Gas | 110 docs |
| DEMO-JETTY | Jetty & Marine Demo | Demos | Infrastructure | 88 docs, 2 cut-offs |
| DEMO-SUB | Substation Demo | Demos | Power | 61 docs |

A new host ships Blank + at least 2 templates + at least 3 demos spread across its industries, each demo with its own data pack, period calendar, and location.

## Keyboard

| Key | Action |
|-----|--------|
| Enter / Space on a card | open |
| Double-click a navigator row | open |
| Esc | close top dialog (confirm → tour → modal → navigator) |
| j / k, `/` | move / filter in the payload log (host view, not the tab) |
