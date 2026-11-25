# Schedule playback — contracts

Read this when implementing legs, Gantt IDs, or map overlays. Keep SKILL.md for the architecture.

## Schedule input (decoder output)

One row per resource:

```json
{
  "tech": 0,
  "name": "Teknisi-1 (Agus)",
  "days": 2,
  "segments": [
    {
      "wo": 3,
      "code": "WO-M-002",
      "day": 0,
      "travelStart": 0.0,
      "workStart": 0.4,
      "workEnd": 2.1,
      "locationId": 5,
      "criticality": 3
    }
  ]
}
```

Rename `tech` → `vehicle` / `nurse` / `machine` in other projects; keep the same time fields.

`travelStart`, `workStart`, `workEnd` are hours **within that day**, in `[0, dayCap]`.

`dayCap = max(regularHours + maxOvertimeHours)` across resources (MOMT default 8+4=12). The Gantt day column width is `dayCap`, not 24.

## Leg record

```javascript
{
  legId, type,        // "work" | "return"
  tech, rowIndex, segIdx, segment,
  fromLocId, toLocId,
  absTravel0, absTravel1, absWork1,
  code
}
```

Build rules:

1. Walk segments in order per resource.
2. If `segment.day` changes, first push a `return` leg from `prevLoc` to depot using travel-time(prev, depot), starting at previous `absWork1`.
3. Push the work leg: from previous location (depot if new day) to `segment.locationId`.
4. After the last segment, push a final return to depot.
5. `maxT = max(leg.absWork1)`.

Travel duration on the map must match Gantt hatch width: `workStart - travelStart` (do not recompute a different matrix on the client unless it is the same function the decoder used).

## Clock

```javascript
animT += (dtMs / 1000) * speed / HOUR_SEC; // HOUR_SEC ≈ 1.2 s per schedule-hour at 1×
clock = `Hari ${floor(animT / dayCap) + 1} · ${hourWithinDay} jam`;
```

Playhead x:

```javascript
x = leftW + day * dayW + hourWithinDay * pxPerHour;
```

`pxPerHour` is the same scale used to place travel/work rects.

## Gantt layers

**Static group** (`.gantt-static-seg`, `data-tech`, `data-si`): full-width bars. Visible when idle.

**Anim group** (`#gantt-anim-layer`, hidden unless playing):

| Element id | Role |
|------------|------|
| `gantt-tr-{tech}-{si}` | travel hatch, width 0 → full |
| `gantt-wk-{tech}-{si}` | work bar, width 0 → full |
| `gantt-ot-{tech}-{si}` | overtime outline, appears after regularHours |
| `gantt-lbl-{tech}-{si}` | task code, show when bar wide enough |
| `sched-anim-playhead` | vertical line, opacity 0 when idle |

During play, set static segments of **active** resources to `opacity=0`. On idle/reset, restore.

Width by phase (same thresholds as map):

| `animT` | travel width | work width |
|---------|--------------|------------|
| `<= absTravel0` | 0 | 0 |
| `< absTravel1` | `full * frac` | 0 |
| `< absWork1` | full | `full * frac` |
| else | full | full |

Do not recreate the SVG on tick. `setAttribute("width", ...)`.

## Map overlay

**Schematic SVG:** absolutely positioned overlay, `pointer-events: none`.

- `.route-anim-leg` per leg: `data-x1 y1 x2 y2`, start with `stroke-opacity=0`
- `.route-anim-dot` per active resource: start `opacity=0`

While traveling, `stroke-dasharray = drawnLen + " " + totalLen`. After arrival, solid line; lower opacity after the work phase ends.

**OSM:** `L.circleMarker` per resource. Each frame `setLatLng([lat, lng])` from `getPosition`. Recreate markers when switching schematic ↔ OSM or when the filter changes.

`getPosition` must take a `toPoint(location)` callback so the same phase logic serves km-space SVG and lat/lng.

## Parallel resources

```javascript
activeTechs.forEach(tech => {
  const pos = getTechAnimPosition(tech, animT, legs, data, toPoint);
  // update that tech's marker only
});
```

Never serialize technicians onto one marker.

## Filter

`techFilter = null` means all. On change: `stop()`, `buildLegs(schedule, filter)`, reset `animT`, recreate overlay markers, update hint text.

## Controls wiring

```javascript
play  → animT=0 (or keep if resume policy), playing=true, visualMode=playing, rAF
pause → playing=false, cancel rAF, keep animT and current frame
reset → stop, animT=0, visualMode=idle, hide playhead, hide dots
speed → write state.speed only (tick reads it next frame)
```

Disable Play when there is no schedule or `maxT <= 0`. Disable Pause when not playing.

## Sync test (do this after implementing)

Pick a known segment. At `animT = absTravel0 + 0.5 * (absTravel1 - absTravel0)`:

- Gantt travel bar is ~50% of hatch width; work bar still 0
- Map marker is halfway along that edge
- Clock matches that day and intra-day hour

If any of the three disagree, the clocks are split — fix before adding cosmetics.
