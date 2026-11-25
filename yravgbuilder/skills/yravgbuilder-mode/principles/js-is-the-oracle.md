# JS is the oracle

**When:** Rust, WASM, Tauri or "make it faster" comes up.

Only a pure, heavy (or cross-platform-exact) core with a JS reference moves to Rust. The JS stays as oracle and fallback. The UI never moves.

Rules:
- Measure the largest real input first. Fast enough in JS: say "no Rust candidate".
- Golden files from JS first; Rust equals JS byte for byte; no float tolerance.
- Rollout: flag off, then default with JS fallback and an opt-out flag.
