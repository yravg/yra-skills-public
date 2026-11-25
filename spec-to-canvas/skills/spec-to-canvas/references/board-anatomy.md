# Board anatomy (the standard every board must meet)

Source: the yraverageMilestone "Feature Windows" canvas (64 boards). Board F14 is the model. A board that
lacks any item below is not finished. `scripts/lint_boards.mjs` checks the machine-checkable items.

Not from `ecc:plan-canvas`: that skill is a browser review loop (annotate, chat, approve). It draws no boards.
The good canvas comes from this anatomy.

## 1. Header (outside the window)

- Eyebrow: tier pill + `ID · TIER · NAME` (mono).
- Title (38 px, 600).
- `Extends:` line. Name the existing screen it extends, or `New (<module>)` when the app has none.
- `Lives in:` line. Exact place in the app: tab, menu path, route. This is the answer to "where is it".

## 2. The window (left, 1140 wide)

Real app chrome (screenshot slices), redrawn body in the app's tokens. Inside the window, three kinds of
marker. Every element that is not a plain copy of today's app carries one.

| Marker | Class | Look | Means | Required text |
|---|---|---|---|---|
| NEW | `.new` + `<span class="newtag">NEW</span>` | yellow outline, yellow tag | App has nothing like it | none |
| PARTIAL | `.part` + `<span class="parttag">PARTIAL</span>` | amber dashed outline, amber tag | Part exists, part is missing | a `.note.pn` beside it: **Exists:** where (screen / file) · **Missing:** the gap |
| BUILT | no outline | plain | Exists today, kept unchanged | none |

Rules:

- Partial must say where the existing part lives. "Partial" alone is a defect.
- Never drop or rename a control that exists today (rule 5). Redrawn controls keep their label.
- Honest states: empty, loading, error, locked, read-only. A locked or blocked control is drawn, greyed, with the reason.

## 3. Callout notes (on the window)

Navy `.note` boxes placed over the window next to the thing they explain. They carry behaviour a still picture
cannot show: gestures, hover, drop, keys, timing, limits. Write each as **bold trigger** then the result:

- `<b>Drop a .mlq</b> on the window or double-click it in Finder / Explorer: it opens here, read-only, in under 50 ms.`
- `<b>Hover a file-map segment</b> to highlight its row; the selected row scrolls the Structure tab to that offset.`

At least 2 per board, 1 per gesture the board introduces. Max width 290 px. Position so they hide no control.
Partial notes use `.note.pn` (amber edge) and start with **Exists:**.

## 4. Aside (right, 388 wide), five cards in this order

1. **What it must show**: 5 to 7 bullets, each testable. A reviewer that is a model reads these, not the image.
2. **Motion**: `name | behaviour, ms, easing or spring`. Last row is always Reduce Motion.
3. **Stories**: per story: ID, source tag, status pill (Built / Partial / New), one line. A Partial story
   adds `Exists: <where>. Missing: <gap>.` as a second line.
4. **Where it lives**: one line per host app/module the board maps to (menu path, route, file). Add the
   owner decisions still open for this board, if any.
5. **States**: one row per state with its Entry click path and Data source (section 9).

## 5. Before / After

Ask the user first (see each skill). Default: After only.

- After only: no toggle, no Before capture, no Before image. The status pills still say what exists today.
- Before and After: toggle `Before | After` in the header, real click handler. Before is the real screenshot,
  never a redraw. Add a third state (`Needs input`, `Error`) when the feature has one.

## 6. Cover and index

Cover: four stat tiles (boards, stories, built, new + partial), one card per tier, "How to read a board"
legend showing the real markers (yellow outline = NEW, amber dashed = PARTIAL, navy note = behaviour,
Built / Partial / New pills), story sources. Index: every story, its status, its board.

## 7. Fidelity rule: recreate the same, not similar

During development the built screen must equal the board:

- Same labels, same order, same states, same sample data. Copy strings from the board, not from memory.
- Each `.newtag` is a build item; each `.parttag` is a gap list; each `.note` is an acceptance test (the gesture must work).
- Compare After capture with the board region by region. Any difference is a defect or a recorded owner decision.

## 8. Reference strip (optional, asked first)

Only when the user said Yes to "snapshots of the reference UI". A white card under the window and aside, full board width:

- Title `Reference: the original UI` plus one line naming the source (e.g. "training videos, cropped frames, for parity only").
- 1 to 6 images, three per row, 270 px tall, `object-fit: contain`, each with a one-line caption naming the state it shows
  (match the board's state buttons where you can). The board grows by about 330 px per row; the canvas row height follows the tallest board.
- Pick the frame that shows the same screen and state as the board. Say so in the caption when no source shows the screen
  (e.g. "objectives are never shown") instead of reusing an unrelated frame silently.
- Crop out browser bars, tabs, user names and avatars, OS taskbars and file dialogs that show personal paths.
- Third-party screenshots stay out of git: write them to a gitignored folder (e.g. `project/ref/`) with a small crop script
  that holds the frame list and crop boxes, and publish them only to the private canvas.
- The strip is reference, not a skin: the board above still uses the host app's own tokens and chrome.

Implementation used in Solvarium (`docs/design/alice-canvas`): `kit.mjs` `board({ ..., refs: { note, shots: [{ img, cap }] } })`, crops by `refs.py`.

## 9. Buildable states, controls and IDs (rules 15 to 17)

Why: on Clausarium (2026-11-17) every state was real markup behind a toggle, but no state said how a user
reaches it, what data fills it, or what each button does. The port copied the picture instead of building
the screen, `?view=` shortcuts were counted as done, and no check caught it.

**IDs (rule 17).** The board root carries `data-screen="S03"`, and the eyebrow shows the same ID. Each
story `.sid` is a feature ID (`F123`), one per PRD row, never reused. Each NEW / PARTIAL marker and each
`data-does` control carries `data-feature="F123"` naming a feature listed in that board's Stories.

**States card** (fifth aside card, title `States`). One row per state, at most 6:

```html
<ul class="states">
  <li class="state" data-state="register"><b>Register</b> · <b>Entry:</b> Projects &gt; Meridian &gt; Register tab. · <b>Data:</b> sample/meridian-register.js → all rows.</li>
  <li class="state" data-state="cop"><b>COP page</b> · <b>Entry:</b> Register: click row COP-014. · <b>Data:</b> sample/meridian-register.js → COP-014.</li>
</ul>
```

- **Entry** is a click path from the app's start page or from another state of this board. A URL
  (`?view=`, `#/route?state=`) is not an entry. No click path: cut the state.
- **Data** names the sample file and the record. The generator imports that file; the app loads it too.
- Every state switch button (the `.vw` toggle, a tab, a third button) carries `data-state="<name>"` with
  a matching row. An After only board still has one row.
- More than 6 rows: split the board into smaller boards, one buildable screen each.

**Controls.** Every `<button>` and `role="button"` in the board carries exactly one of:

| Attribute | Means | Extra |
|---|---|---|
| `data-does="<one line>"` | Built in this wave; the line is its acceptance | `data-feature="F…"` |
| `data-later="<what it will do>"` | Shown as future only; do not build a fake | `<span class="latertag">LATER</span>` inside; app draws it disabled with `title="Later: …"` |
| `data-state="<name>"` | Switches the board's state | matching States row |

`lint_boards.mjs --manifest <file>` writes all of this per board (`screen`, `states[]` with entry and
data, `controls[]` with does / feature, `later[]`). The app harness reads that file (SKILL.md, State gate).

