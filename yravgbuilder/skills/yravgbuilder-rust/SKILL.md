---
name: yravgbuilder-rust
description: Use when bringing Rust into an existing JavaScript / TypeScript app (Vite, React, Next.js, Express, vanilla JS, browser extension) - deciding what moves to Rust, starting an engine-rs workspace, planning RS-<AREA>.<n> cards, or shipping one product as web SaaS plus Windows / macOS desktop. Also when the user says "do the Solvarium Rust thing", "mixed Rust", "port to Rust", "WASM engine", "Tauri desktop" for another app.
---

# Mixed Rust development (the Solvarium method)

The app stays JS / TS. Only the pure, heavy, deterministic core moves to Rust, slice by slice. The JS function stays as
the **oracle** (golden files are generated from it) and the **fallback** (it answers whenever Rust refuses or is not
loaded). The UI is never rewritten in Rust (no egui / Dioxus / Leptos). Desktop = Tauri 2 around the same web build.

Reference implementation: the Solvarium repo (`engine-rs/README.md`, `engine-rs/CHANGELOG.md`,
`app/src/engine/engineApi.js`, `app/scripts/{gen-engine-golden,test-engine-rs,build-engine-wasm,test-engine-wasm}.mjs`).
Read those files when a template here is not enough. Never copy Solvarium client data or golden files into another repo.

## Sub-skills

| Step | Load |
|---|---|
| Port one JS function / area to a crate with golden files and the gate | `yravgbuilder-rust-port` |
| WASM door with JS fallback, Docker / CI build, Tauri desktop, updater | `yravgbuilder-rust-ship` |
| Which app has which candidate (from the SaaS Readiness Atlas) | `apps.md` in this folder |

## 1. Decide what moves (most apps: nothing)

Rust earns a slot only when ALL hold:
- pure logic: data in, data out (solver, scheduler, parser / decoder, maths, metrics, diff, file format, crypto check);
- CPU-heavy or must give identical numbers on web, server and desktop;
- has a JS version to act as oracle (or you write the JS reference first, contract + hand-computed tests).

Measure before you decide: time the core on the largest real input (web and Node). If it is fast and the only reason is
"same numbers on desktop", the JS core already gives that inside a Tauri WebView: ship RS-DESK without a Rust core and
tell the owner.

Stays JS / TS: UI, routing, auth, billing, DB queries, CRUD, email, i18n, glue. A CRUD SaaS (booking, POS, Kanban) gets
no Rust core; it may still get a Tauri shell (RS-DESK) if a desktop sale needs it. Say so plainly; do not invent a port.

## 2. Make the JS core port-ready (before any Rust)

One pure module, header comment with input JSON, output JSON (key order), units, refusals. No DOM, `Date.now()`,
`Math.random()` (seeded RNG), `fetch`, `localStorage` inside. Stable sorts with full tie-break. No `Math.pow` with
fractional exponents where numbers must match across OSes. JSON out (no Set / Map / class in results). Hand-computed
`scripts/test-<topic>.mjs` first.

- Dates: local `new Date(y, m-1, d)` maths on `yyyy-mm-dd` strings depends on the timezone. Make the core work in whole
  day numbers (days since an epoch, UTC) or plain `{y,m,d}` arithmetic before porting; Rust uses the same integer days
  (no `chrono` needed; any date crate must build for wasm).
- Functions that change their input in place: split into a pure function returning a patch / new values and a thin JS
  applier. Only the pure part is ported.
- Ids from `Date.now()` / `Math.random()` stay in the JS caller, outside the ported core.
- Fit the app's layout: no `package.json` / `scripts/` / bundler? Put generators and gates where its tests already live
  (e.g. `tools/*.test.mjs`) so the existing CI loop runs them. The paths in these skills are Solvarium defaults.

## 3. Order of cards

| Card | Lands |
|---|---|
| `RS-CORE.1` | `engine-rs/` workspace (template below), RNG / shared types, first golden file |
| `RS-GATE.1` | `gen-engine-golden.mjs` + `test-engine-rs.mjs` gate, in `npm test` and CI |
| `RS-<AREA>.1..n` | one crate per engine area, golden-equal (`yravgbuilder-rust-port`) |
| `RS-WASM.1..3` | wasm crate; door behind a flag; Worker; then default with JS fallback (`yravgbuilder-rust-ship`) |
| `RS-DESK.1..n` | Tauri 2 shell, sidecar for the Node API if the app has one, signed updates |
| `RS-SVC`, `RS-LAUNCH` | release feed, launcher: only when two desktop apps exist |

**Card = area, never renumbered. Change = area + next number** (`RS-CPM.3` continues `RS-CPM`). Commit footer
`PRD: RS-CPM.3`. `engine-rs/CHANGELOG.md`: one section per area, newest last, each line says what equals what and the
evidence (golden cases, cells, mismatches = 0). Next number: `grep -n "^- RS-CPM\.[0-9]*" engine-rs/CHANGELOG.md | tail -1`.

## Workspace template (`engine-rs/Cargo.toml`)

```toml
[workspace]
resolver = "3"
members = ["crates/<app>-core", "crates/<app>-wasm"]
exclude = ["crates/<app>-desktop"]   # Tauri needs WebView2 / MSVC; keeps the gate light

[workspace.package]
version = "0.1.0"
edition = "2024"
rust-version = "1.99"   # pin; same version in CI, Dockerfile, rust-toolchain
license = "MIT"
publish = false

[workspace.lints.rust]
unsafe_code = "forbid"

[workspace.lints.clippy]
unwrap_used = "deny"
expect_used = "deny"
panic = "deny"
dbg_macro = "deny"
todo = "deny"
```

`clippy.toml`: `allow-unwrap-in-tests = true`, `allow-expect-in-tests = true`, `allow-panic-in-tests = true`.
Every crate: `version.workspace = true` (and edition, rust-version, license, publish) plus `[lints] workspace = true`.
Commit `Cargo.lock`; `target/` and the built wasm `pkg/` are gitignored. Add `engine-rs/README.md` with the crate table
and the card scheme.

## Common mistakes

| Mistake | Fix |
|---|---|
| Porting CRUD / UI to "use Rust" | Only pure heavy cores move; say "no Rust candidate" |
| Rust written first, JS reference later | Golden from JS first, Rust test fails, then port |
| JS function deleted after the port | It stays: oracle for golden files and runtime fallback |
| New card per fix | Next number in the same area |
| Rust default on day one | Flag off, then on with fallback, then default (RS-WASM.1-3) |
| Client data in golden files or commits | Synthetic + demo data and seeded fuzz only |

Delegating: the brief names this skill and the sub-skill, keeps a checkpoint (global CLAUDE.md format), and says
"review your own diff for bloat".
