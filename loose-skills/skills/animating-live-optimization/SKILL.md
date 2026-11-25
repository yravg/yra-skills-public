---
name: animating-live-optimization
description: Use when building live charts that update while an optimizer is still running, when the user asks for Pareto/hypervolume/convergence animation during NSGA-II, GA, PSO, local search, or similar solvers, or when porting live optimization visualization to a different domain or objective set.
---

# Animating Live Optimization

## Overview

Show search progress **while the solver is running**, not after it finishes. The solver emits a snapshot each generation/iteration; the UI redraws Pareto projections and a convergence curve from that stream.

**Core rule:** one streaming clock (generation/iteration) drives the charts. Do not wait for the final JSON and then "animate" it.

## When to Use

- User wants live Pareto, hypervolume, IGD, best-so-far, or progress bars during optimization
- Comparing 2+ algorithms on the same run (NSGA-II vs hybrid vs random, etc.)
- Porting this pattern to another project (VRP, nurse rostering, machine scheduling, energy dispatch)

**Do not use** for schedule playback (Gantt + map). That is `animating-schedule-playback`.

## Apply to this project first

Before coding, map the host project's vocabulary. Do not copy MOMT field names blindly.

| Role | MOMT example | Other projects |
|------|----------------|----------------|
| Decision maker / resource | teknisi | vehicle, nurse, machine, AGV, drone |
| Task | work order | job, visit, patient, pickup, order |
| Location | plant area | customer, ward, node, depot |
| Objective f1 | weighted downtime | makespan, tardiness, wait |
| Objective f2 | travel time | distance, empty miles, setup |
| Objective f3 | overtime cost | labor, energy, risk (omit if bi-objective) |
| Convergence metric | hypervolume | HV, IGD, epsilon, best-f, gap to bound |
| Time axis | generation | iteration, epoch, evaluation count |
| Algorithm series | NSGA-II / Hybrid / Random | any solvers being compared |

If the problem is **single-objective**, drop Pareto scatter plots; keep a live best-so-far line + progress. If **2 objectives**, one scatter + HV/2D area. If **3+**, pairwise 2D projections (n choose 2), not a forced 3D plot.

## Required architecture

```
Solver (each gen) --> progress event (NDJSON/SSE) --> UI throttle (rAF) --> charts
     |                                                      |
     +--> final result event -------------------------------+--> replace live with final
```

1. **Stream, do not poll.** `POST /api/optimize-stream` returns `application/x-ndjson` (or SSE). One JSON object per line.
2. **Stdout vs progress.** Solver final JSON stays on stdout. Progress lines go to stderr with a prefix (`@@PROGRESS@@`) so logs never corrupt the result. The server strips the prefix and forwards JSON lines to the client.
3. **Opt-in.** A "live charts" flag. Off = progress bars only (faster). On = attach `live` payload.
4. **Throttle draws.** Coalesce events with `requestAnimationFrame`. Do not redraw on every chunk.
5. **Same chart functions for live and final.** Pass `live: true` only to change titles/suffix. After `type: "result"`, render the authoritative front (re-normalized HV).
6. **Cancellable.** Stop flag checked between generations; return partial result, do not discard the run.

## Implementation checklist

Copy and track:

```
Live optimization
- [ ] Stream endpoint (NDJSON or SSE), not a single blocking JSON response
- [ ] Per-algorithm progress: phase start|running|done, current/total, overall 0..1
- [ ] Live payload: current front (capped) + hvHistory[] (or bestHistory[])
- [ ] Pairwise objective scatter(s) + one convergence line chart
- [ ] Stable algorithm colors; compromise/star marker optional during live
- [ ] rAF throttle; show results panel immediately with empty axes
- [ ] Fallback if stream route missing: blocking optimize + static charts
- [ ] Cancel/stop; keep partial fronts
- [ ] Final render replaces live (do not leave approximate HV as the published number)
```

Payload shapes and HV caveats: [reference.md](reference.md)

## Core pattern (solver side)

Each generation, after environmental selection:

```python
on_progress(gen, n_gens, "Generasi %d / %d" % (gen, n_gens),
            {"front": current_pareto_objs, "hvSample": current_pareto_objs})
```

- `front`: list of objective vectors (not full chromosomes). Cap size (e.g. 50) by crowding distance.
- `hvSample`: same front; the **host** appends one HV value so the stream does not resend the whole history every tick.
- Live HV uses **expanding min/max bounds** seen so far. Label it approximate. Recompute HV on the final combined reference point for the paper/result cards.

Non-generational solvers (random search, greedy): emit every N evaluations, or once at the end with a single point.

## Core pattern (UI side)

```javascript
function queueLiveCharts(live) {
  pending = live;
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = null;
    const snap = pending; pending = null;
    if (snap) renderCharts(snap); // same renderers as the final result
  });
}
```

Read the NDJSON body with `ReadableStream` + line buffer. On `type: "progress"` update bars and optionally charts. On `type: "result"` call the full results renderer.

## Visual contract

Dark research-dashboard look is fine; keep it readable:

- One scatter per objective pair (`f1 vs f2`, `f1 vs f3`, `f2 vs f3` for 3-obj)
- One HV (or metric) line: x = generation, y = normalized metric
- Legend: algorithm color + optional star = compromise solution
- Summary cards: current HV and front size per algorithm
- Progress: overall bar + one bar per algorithm (`start` / `running` / `done`)

## Common mistakes

| Excuse | Reality |
|--------|---------|
| "I'll draw charts when optimize() returns" | That is a static plot, not live animation |
| "Poll every 500ms" | Use a push stream; polling lags and wastes evals |
| "Put progress JSON on stdout" | Corrupts the final result; use stderr + prefix |
| "Send the whole population" | Cap the displayed front; send objectives only |
| "Live HV is the paper number" | Expanding bounds make HV drift; recompute at the end |
| "Redraw on every event" | Coalesce with rAF or you will jank |
| "Hard-code f1/f2/f3 labels" | Read `objectivesMeta` (or project equivalent) |

## Red flags — stop and fix

- Charts appear only after the run finishes
- `index.html` opened as a file (no server → no stream)
- One clock per algorithm with independent x-axes that cannot be compared
- WebSocket "because it is more real-time" when NDJSON already works
- 3D WebGL Pareto for a thesis dashboard (pairwise 2D is the requirement)

## Porting to another stack

- Python solver + Node/Flask/FastAPI bridge is the proven split. A pure-JS solver can emit the same events in-process.
- SSE (`text/event-stream`) is an acceptable substitute for NDJSON.
- Chart.js / Plotly / Canvas are all fine if they support incremental updates. Do not rebuild the whole page.
- For Jupyter/desktop: the same snapshot contract; replace fetch-stream with a callback or queue.

When the user also wants Gantt/map playback of a selected solution, follow `animating-schedule-playback` after the run (or on a selected live individual if the stream includes a schedule — usually too heavy; stream objectives only).
