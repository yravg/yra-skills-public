# Slop checklist

Each line is a tell that a screen was generated, not designed. Remove it or say why it stays.

## Data and truth
- Invented company names, people, figures or logos shown as if real (Acme, Globex, Northwind, Jane Doe). Use the project's demo data, or label the set "Sample data" in the UI.
- Numbers that do not add up (totals, percentages, counts in a badge vs rows).
- Fake success: "Saved" with no save, a chart with no source.

## Controls
- Buttons with no handler, or handlers that only `console.log`.
- A control lost from the previous version of the screen.
- Unicode glyphs or emoji as icons, sort arrows included (▲ ▼ ↑ ↓ ✕ ⋯ ›).
- Stroke-only grey icons in a top toolbar.
- `all: unset` on buttons without a restored focus ring.

## Style
- Raw hex or rgb in component CSS; a private palette defined inside one component.
- Uppercase, letter-spaced table headers or eyebrow labels by reflex.
- One coloured word in a headline; gradient text; multi-stop gradients.
- Shadow on every card; card inside card; three equal cards by default.
- `transition: all`; motion over 200 ms on a data tool; blur without a reason.
- Centred marketing hero inside a tool.
- System font stack where the app has a house font.

## States
- Only the happy path: no loading, empty, error or long-content state.
- Empty state that says "No data" with no next action.
- Disabled control that looks the same as enabled.

## Copy
- Lorem ipsum, exclamation marks, "Seamlessly", "Unlock", "Supercharge".
- Hard-coded currency or locale (`en-US`, `USD`) in a multi-country app.
- Error text without a next step.

## Process
- Screen never rendered and viewed before "done".
- Component rebuilt from scratch when the catalogue or repo had it.
