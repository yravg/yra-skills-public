# Live optimization — stream contract

Read this when implementing endpoints, payloads, or hypervolume. Keep SKILL.md for the architecture.

## Transport

### HTTP (preferred)

```
POST /api/optimize-stream
Content-Type: application/json
→ 200 application/x-ndjson; charset=utf-8
   Cache-Control: no-cache
```

Body: `{ data, params }` where `params.liveCharts` is boolean and the server sets `streamProgress: true`.

Each line is one JSON object. Types:

| `type` | When | UI action |
|--------|------|-----------|
| `progress` | every generation / N evals | bars; if `live` present, queue charts |
| `result` | success | `result` is the full optimize payload |
| `error` | failure | abort, show message |

Fallback: if the route is 404, call blocking `POST /api/optimize` and render static charts.

### Process split (Python engine + Node/Flask)

- **stdout:** one final JSON document (or nothing until `result` is written by the server).
- **stderr:** lines `@@PROGRESS@@{json}\n` flushed immediately.
- Server parses stderr, strips prefix, `res.write(JSON.stringify(evt) + "\n")`.
- Client: `getReader()` + `TextDecoder` + leftover line buffer (chunks split mid-line).

### Cancel

Server writes a flag file (or sets an atomic). Solver checks `should_cancel()` at generation boundaries, then emits a final `result` with `stoppedEarly: true` and whatever fronts exist.

## `progress` event

```json
{
  "type": "progress",
  "algorithm": "hybrid",
  "label": "Hybrid NSGA-II + Local Search",
  "phase": "running",
  "current": 40,
  "total": 120,
  "fraction": 0.333,
  "overall": 0.52,
  "detail": "Generasi 40 / 120",
  "live": { }
}
```

`phase`: `start` | `running` | `done`.  
`overall`: 0..1 across all selected algorithms (leave ~5% for post-processing).  
Omit `live` when `liveCharts` is false.

## `live` payload

```json
{
  "live": true,
  "objectivesMeta": [
    { "key": "f1", "label": "Total downtime tertimbang (jam)", "unit": "jam" },
    { "key": "f2", "label": "Total waktu perjalanan (jam)", "unit": "jam" },
    { "key": "f3", "label": "Total biaya lembur (Rp)", "unit": "Rp" }
  ],
  "algorithms": {
    "nsga2": {
      "label": "NSGA-II",
      "front": [{ "objectives": [12.1, 3.4, 850000] }],
      "frontSize": 18,
      "hvHistory": [0.41, 0.55, 0.61],
      "hypervolume": 0.61
    }
  }
}
```

Rules:

- `front` is display-only. No chromosomes, no schedules.
- Cap `front` (crowding distance, typical cap 50).
- Append one HV sample per generation; send the accumulated `hvHistory` (short float array). Do not resend all past fronts.
- Algorithm keys and colors must match the final result object so live → final is a swap, not a remap.
- For 2 objectives, `objectives` has length 2 and only one scatter is required.
- For 4+ objectives, still pairwise plots of the **primary** pairs, or a 2D projection the user cares about. Do not invent a 3D viewer unless asked.

## Final `result` (authoritative)

Same `algorithms[key].front` / `hvHistory` / `hypervolume` / `frontSize` plus timing, selected compromise, and full solutions (including schedules for playback).

Recompute HV with a **fixed** reference point from the union of all algorithms' objective ranges. Live HV used expanding bounds and must not be copied into thesis tables.

## Hypervolume notes

- Minimize-all: normalize each objective to `[0, 1]` with current (or final) min/max, reference e.g. `(1.1, 1.1, 1.1)`.
- Live: expanding `bound_lo` / `bound_hi` across algorithms already streamed. Early HV is not comparable to final HV.
- Single-objective: `hvHistory` becomes `bestHistory` (best f so far). Chart title changes; the stream shape can stay the same (`values: number[]`).
- Random/greedy baseline: one point or a stepwise curve vs evaluation count. Stretch x to generation-equivalent if the experiment uses equal evals (`popSize * (generations+1)`).

## Client parse loop

```javascript
const reader = res.body.getReader();
const decoder = new TextDecoder();
let buf = "", finalResult = null;
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buf += decoder.decode(value, { stream: true });
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    const evt = JSON.parse(line);
    if (evt.type === "progress") onProgress(evt);
    if (evt.type === "result") finalResult = evt;
    if (evt.type === "error") throw new Error(evt.error);
  }
}
```

## UI prepare (before first event)

Show the results panel immediately: empty scatter axes, empty HV chart, status card "Optimasi berjalan…". Scroll into view once. Hide solution detail / Gantt until a final (or selected) solution exists.

## Equal-evals comparison

When overlaying a random-search baseline on the HV chart, give it the same evaluation budget as the GA, not "one generation". Plot vs generation index of the evolutionary methods, or vs evaluations — pick one x-axis and document it on the axis label.
