# Porting examples

The tab is the same in every host: three shelves, navigator, versions, guarded delete, optional guest mode. Only the nouns, the payload, and the period rule change.

## 1. Rename table for three non-DCS hosts

| Slot | Procurement tracker | HSE incident log | Construction schedule |
|------|--------------------|------------------|-----------------------|
| Record | package book (`PKG-A`) | site log (`SITE-01`) | schedule (`SCH-PLT`) |
| Payload | POs, vendors, expediting rows | incidents, actions, permits | activities, resources, calendars |
| Version | month-end close | weekly HSE report | data date / baseline |
| Period rule | last working day of month | Monday | any date; Save version = +7 days |
| Industry line | client · category | site type · risk class | industry · contract type |
| Card meta | `128 POs · 4 closes · Aug-26` | `37 incidents · 12 reports · Mon 14-Sep` | `412 activities · 3 baselines · DD 18-Sep` |
| Templates | Blank, EPC package set, Service contract set | Blank, Offshore site, Onshore yard | Blank, Turnaround, Greenfield EPC |
| Demos | 3 sample package books | 3 sample site logs | 3 sample schedules |
| Tour groups | Tour general / Tour for buyer | Tour general / Tour for HSE officer | Tour general / Tour for planner |

Change `requireFriday` / `nextFridayAfter` to the host period functions. Keep the label pattern `{Period} {n}` so the VERSION column reads well.

## 2. Same REST, new domain

```
Project           → keep: id, code, name, location, industry, contract_no, kind, notes, updated_at
Cutoff            → rename in UI only ("Close", "Report", "Baseline"); keep table + routes
Document tables   → replace with the host payload tables, keyed by cutoff_id
clone_cutoff      → deep-copies the host payload rows to the new cutoff
clone_project     → copies project + every cutoff + payload
ensure_catalog    → seeds the host's TUT/DEMO catalog rows (kind='catalog')
```

Do not add a second "projects" endpoint for the navigator. Do not store versions as JSON blobs on the project row.

## 3. No backend yet (local-first)

Implement the same client API over `localStorage`, then swap to `fetch` later.

```js
const KEY = '{app}.projects.v1'
const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{"projects":[]}') } catch { return { projects: [] } } }
const write = (db) => localStorage.setItem(KEY, JSON.stringify(db))

export const api = {
  projects: async () => read().projects.filter(p => p.kind !== 'catalog').sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')),
  createProject: async (body) => { /* clone catalog or create blank + first version */ },
  duplicateProject: async (id) => { /* deep clone, unique code, kind 'my' */ },
  deleteProject: async (id, code) => { /* same guards as the server */ },
  saveCutoffVersion: async (cutoffId, body) => { /* clone payload, ver+1, next period */ },
  patchProject: async (id, body) => {}, patchCutoff: async (id, body) => {},
}
```

Keep the guards (typed code, not last project, catalog read-only) in this module, so the REST swap does not change behaviour.

## 4. Minimal first ship, then fill

1. `GET/POST/DELETE /api/projects` + home with My projects shelf + Blank + typed-code delete
2. Versions: cut-off table, picker, Save version
3. Navigator with My projects storage only
4. Templates + Demos (catalog kind, clone-on-open) and the tour prompt
5. Guest `/demo` with soft gates, if the product has a public trial

Do not ship a plain table page instead of the navigator. The storages + CODE/NAME/INDUSTRY/VERSION/DATE window is part of the standard.

## 5. yraverageDCS itself

Use the files listed in SKILL.md as the source of truth. Authenticated `/w/[id]/*` keeps its current chrome. The guest `/demo` desk and landing proof use `--desk-accent` orange; marketing pages keep steel-blue. Public seeds stay neutral (`PROJ-A`, `DEMO-*`).
