# Enterprise patterns

Defaults for the screens every business app has. Search the catalogue for each piece first (`search "<pattern>"`).

## List + detail
- Toolbar (search, filters as chips, view switch, primary action at the right), table, detail panel docked right (288-360 px) that pushes the table, never covers it.
- Selection count and bulk actions appear in the toolbar only when rows are selected.
- URL holds filter, sort and the open record, so a link reproduces the view.
- 10k+ rows: virtualise or paginate on the server; say which in the footer ("1-50 of 12,480").

## Data table
- `table-layout: fixed` with a `colgroup`; sticky header; numbers right aligned, tabular.
- Sort: `aria-sort` on `th`, a real button inside, one sort icon from the set.
- Row click opens detail; checkbox cell stops propagation; keyboard: arrows move, Enter opens, Space selects.
- Empty, loading (skeleton rows), error (inline banner + retry), filtered-to-nothing (offer "Clear filters").
- Column chooser and density toggle for wide data; remember them per user.

## Toolbar
- Group by task: create, edit, view, export. Overflow menu for the rest; never drop a command.
- Coloured icons + short labels at desktop width; icon + tooltip when narrow.
- Disabled commands explain why in the tooltip.

## Form
- One column, labels above, 24-28 px fields, help text under the field, error under the field in `--danger` with the fix.
- Validate on blur and on submit; never block typing. Server errors map back to fields.
- Dirty state: Save enabled only when changed; leaving with changes asks once. Autosave shows "Saved 10:42".
- Required marked once in the legend, not with a red star on every label.

## Dashboard
- KPI tiles show value, unit, period and source; a delta only with its base. No chart without a data source line.
- One question per chart; legend order = series order; colours from the chart palette tokens.
- Use the `dataviz` skill for any chart.

## Settings
- Left list of sections, right panel; search across settings; each change says where it applies (user, team, org).
- Danger zone last, typed confirmation for irreversible actions.

## Approval / workflow
- Status pill + timeline of who did what when. Approve and Reject carry a comment field. Undo window or a recorded reversal; never silent.

## Multi-tenant and roles
- Every screen states which org or project it shows. Actions the role cannot do are hidden or disabled with the reason; the server still checks.
