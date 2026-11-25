---
name: yravgbuilder-ui
description: UI standard for enterprise and business app screens - reuse the yravg catalogue source (B1 Clean), tokens only, every state, coloured toolbar icons, accessibility floor, dense data layouts (tables, toolbars, side panels, forms), and the anti-slop checklist. Use when building, restyling or reviewing any app screen, list, table, form, dashboard, toolbar or panel, when picking components or tokens, or when output looks generic or AI-made.
---

# yravgbuilder UI

A business screen is a tool, not a poster. Dense, calm, keyboard friendly, honest about its data. Gate: `../yravgbuilder/SKILL.md`.

## 1. Reuse before you draw

1. Search the project's own components first (for example `src/design/ui`, `src/components`).
2. Then the yravg catalogue: `npx -y https://uiux.yraveragehub.io/cli/yravg-ui-0.2.0.tgz search "<need>"`, `recommend "<screen>"`, `info <name>`, `add <name>`. Source: `src/own/<section>/<name>.t1.tsx` in the yravg UI catalogue (B1 Clean). Preview: `<section>/<name>/preview.html?stage&style=clean&tpl=1`.
3. Copy the real source and adapt it. Never rebuild a piece from a screenshot or memory; a look-alike is a defect.
4. Write new only what neither has, and say why in one line.

Template numbers: A1 = `<name>.tsx`, B1 = `.t1.tsx`, A2 = `.t2`. Default B1; A1 or A2 only when the owner picked it for that screen. `vendor/yravg-ui` (classic set) is not B1.

## 2. Tokens

- Colour, radius, height, spacing, duration: tokens only. Catalogue names: `--canvas --surface --line --line-strong --track --ink --ink-dim --ink-faint --ink-off --accent --ok --warn --danger --font --mono`. Tints via `color-mix(in srgb, var(--accent) 12%, transparent)`.
- App has its own names (Solvarium: `--panel --text --muted --bad`)? Keep them and map once in a bridge block at the top of the UI stylesheet. Never mix both in one component.
- A look change goes into the token or design stylesheet, never into JSX.
- New token: add it once in the token file. Global tokens, fonts and the accent are the owner's: ask.
- Status and data colours (RAG, flags, actuals, diff highlights) never change in a redesign.

## 3. Density and type (data views)

Body 13-14 px, rows 28-40 px, 4 px grid, radius 4-8, one accent, max two elevation levels (1 px border before shadow). Numbers `font-variant-numeric: tabular-nums`, right aligned, units in the header. Dates in one format per app. Money and locale from settings, never hard-coded. Matching a design mock: use its font families and sizes exactly.

## 4. Icons

- One icon set per area, inline SVG. Never emoji or Unicode glyphs as icons, sort arrows included (▲ ▼ ↑ ↓ ✕ ⋯ ›): draw them from the set.
- Top toolbar, ribbon and submenu icons are coloured multi-fill icons, never stroke-only `currentColor`. Other places may use the one stroke set.
- Icon-only control: `aria-label` and `title`.

## 5. Every state, in the same change

Default, hover, focus-visible (ring in `--accent`; never `outline: none` alone), active, disabled (looks different, says why in a tooltip), loading (skeleton in place, not a spinner), empty (what this is + the next action), error (what failed + what to do + retry), partial, long content (truncate on purpose + full text in `title`), light and dark. Destructive action: confirm in place or undo toast for 5 s.

## 6. Accessibility floor

Text contrast >= 4.5:1, borders and focus >= 3:1. Real `<button>`, `<input>`, `<table>`; never clickable divs. Labels tied to inputs. Tab order = visual order. Escape closes overlays and returns focus to the opener. `prefers-reduced-motion`: snap 80-120 ms, loops stop. Usable at 200 % zoom and 390 px. `data-testid` on every control a test or tour clicks.

## 7. Controls and chrome

- No dead control. A button with no behaviour yet is not shown, or is disabled with a "coming in <release>" tooltip the owner agreed.
- Never remove a control for looks: move it behind a fold, tab or overflow menu. Record a removal or rename with its reason in the control registry if the app has one.
- Mock-ups keep the app's real chrome (screenshot slices), never a redrawn top bar.
- Navigation rails stay docked; clicking expands in the panel, not in a floating window.

## 8. Copy

No literal UI text in JSX when the app has i18n (keys `area.slug`, same keys in every language). Short product English. Errors say what happened and what to do. No lorem ipsum, no exclamation marks, no emoji, no marketing tone in a tool.

## References

- `references/enterprise-patterns.md`: list + detail, data table, toolbar, form, dashboard, settings, approval flow.
- `references/slop-checklist.md`: tells to remove before review (read it when tastestack is not installed, and on every review anyway).
