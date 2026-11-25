---
name: animating-schedule-playback
description: Use when building play/pause/reset schedule playback with a Gantt chart and a route map that must stay synchronized, when the user asks for animated technicians, vehicles, agents, playhead, travel vs work bars, or moving map markers, or when porting this playback to a different resource/task domain.
---

# Animating Schedule Playback

## Overview

Playback is a **single clock** `animT` that drives every view. Gantt bars grow, a playhead moves, and map markers travel along legs. If Gantt time and map position can disagree, the implementation is wrong.

**Core rule:** derive positions from `animT` + precomputed legs. Do not run a separate animation per technician, per bar, or per map polyline.

## When to Use

- User wants Putar / Jeda / Reset, speed, and a clock ("Hari 1 · 3,2 jam")
- Gantt per resource plus a map of routes (or a schematic layout)
- Multiple resources moving in parallel
- Porting to VRP, field service, nurse rounds, AGV, machine cells (Gantt only if there is no geography)

**Do not use** for live Pareto/HV during the solver. That is `animating-live-optimization`. Playback starts from a **selected solution's schedule**.

## Apply to this project first

| Role | MOMT example | Other projects |
|------|----------------|----------------|
| Resource row | teknisi | vehicle, nurse, machine, crew |
| Task block | work order | job, stop, visit, operation |
| Travel | hatched Gantt + map lerp | deadhead, walking, setup, empty trip |
| Overtime | red after regular hours | extra shift, peak tariff, tardiness zone |
| Map nodes | plant areas | customers, wards, machines, GPS stops |
| Depot | workshop | warehouse, hospital base, depot |
| Day window | regularHours + maxOT (e.g. 8+4) | shift length, not necessarily 24h |
| Clock | `day * dayCap + intraDay` | same formula with that project's day cap |

If there is **no map**, still use the same clock + Gantt playhead. If there is **no Gantt**, still use legs + map markers. Prefer both.

## Required architecture

```
schedule.segments  -->  buildLegs()  -->  legs[] with absTravel0/1, absWork1
                                              |
Play / rAF tick --> animT += dt * speed / HOUR_SEC
                                              |
                    +-------------------------+----------------------+
                    |                         |                      |
              updateGantt(animT)      updateMap(animT)         updateClock(animT)
```

1. **One state object:** `playing, animT, maxT, speed, rafId, lastTs, legs, ganttLayout`.
2. **Controls:** Play (restart from 0 or resume), Pause (keep `animT`), Reset (`animT = 0`, hide playhead), Speed slider (0.25×–4×).
3. **rAF tick:** `animT += (dt_ms / 1000) * speed / HOUR_SEC` where `HOUR_SEC` is seconds of wall time per one schedule-hour at 1× (e.g. 1.2).
4. **Stop at `maxT`:** freeze on last frame, return to idle visuals (full static Gantt visible).
5. **Filter:** changing "one resource vs all" rebuilds legs and resets; do not leave markers for hidden resources.

## Implementation checklist

```
Schedule playback
- [ ] Play / Pause / Reset / speed / clock in one toolbar
- [ ] Flatten schedule into legs (travel, work, return-to-depot)
- [ ] Absolute times on a shared axis (day * dayCap + time-of-day)
- [ ] Gantt: static full schedule + anim layer (width 0→full) + orange playhead
- [ ] Map: node layer + per-leg lines + one marker per active resource
- [ ] getPosition(resource, animT) used by every map view (SVG and OSM)
- [ ] Travel = lerp along edge; work = parked at node; idle = stay; return = lerp to depot
- [ ] All visible resources tick in parallel from the same animT
- [ ] Prepare() whenever the selected solution or filter changes
```

Data shapes, Gantt IDs, and position logic: [reference.md](reference.md)

## Core pattern — legs

Each resource's day is a sequence of segments. Convert to legs in **absolute hours**:

```
absTravel0 = day * dayCap + travelStart
absTravel1 = day * dayCap + workStart
absWork1   = day * dayCap + workEnd
```

Insert a **return-to-depot** leg at day change and at end of tour. `maxT = max(absWork1)`.

`dayCap` is the plotted day length (regular + max overtime), **not** 24, unless the model truly uses calendar hours on the Gantt.

## Core pattern — position

For each resource, walk that resource's legs:

- `animT < first.absTravel0` → at depot, hidden or idle
- in `[absTravel0, absTravel1)` → lerp from → to (phase `travel`)
- in `[absTravel1, absWork1)` → sit at `to` (phase `work`)
- gap before next leg → sit at last `to` (phase `idle`)
- after last leg → sit at final node / depot (phase `done`)

Gantt uses the same thresholds to grow travel hatch, then work bar, then overtime outline. Map uses them to dash-draw the current edge and move the marker.

## Visual contract

**Toolbar:** Putar, Jeda, Reset, kecepatan, clock, hint ("N teknisi berjalan paralel").

**Gantt:**
- Row per resource, columns per day, hour ticks
- Hatch = travel, solid = work (color by task type/criticality), red outline/zone = overtime
- Orange vertical playhead at `animT`
- While playing, hide static bars for active rows and reveal the growing anim layer so the chart "fills in" over time

**Map:**
- Nodes labeled; depot distinct
- Resting route polylines (low opacity)
- Anim overlay: current edge draws with `stroke-dasharray`; marker is a colored circle with resource index
- OSM/Leaflet: same `getPosition`, `marker.setLatLng`; schematic SVG: `cx/cy`
- Legend colors match Gantt rows

## Common mistakes

| Excuse | Reality |
|--------|---------|
| "CSS animation on each bar" | Bars will not share one clock or speed control |
| "Move markers with Leaflet `moveAlong`" plus a separate Gantt timer | They will drift |
| "Playhead uses 24h, decoder uses 12h windows" | Clock, Gantt, and map must share `dayCap` |
| "Teleport marker to the next node" | Travel phase must lerp |
| "One marker, cycle through technicians" | Parallel resources, one marker each |
| "Rebuild SVG every frame" | Mutate `width`, `x1/x2`, `cx/cy`, dashoffset |
| "Animate before schedule exists" | Disable Play until `maxT > 0` |

## Red flags — stop and fix

- Gantt playhead at a node while the map marker is still on the road (or the reverse)
- Pause does not freeze both views
- Speed changes duration of CSS transitions instead of `animT` slope
- Filter to one technician leaves other markers moving
- Opening playback without a selected Pareto solution

## Porting to another stack

- **VRP / field service:** vehicles = rows; customers = nodes; service time = work; deadhead = travel.
- **Job-shop:** machines = rows; skip map or use a shop-floor schematic; setup = hatch.
- **Home health / nurses:** wards or GPS; walking time = travel.
- **Single day:** `dayCap = horizon`; omit day labels.
- **Real geo:** Leaflet/Mapbox markers; keep schematic fallback if offline.
- **Paired crews:** one Gantt row per person (or per crew if they always move together); map markers must follow the same legs.

Live optimization may stream a compromise schedule; only attach playback if the payload includes segments. Prefer playback on the **final selected solution**.
