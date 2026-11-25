---
name: rust-mixed-ship
description: Use when a ported Rust crate must run inside a JS / TS app - a wasm-bindgen crate, the engineApi door with JS fallback and opt-out flag, building the wasm in Vite / Next.js / Node / a Web Worker, Docker and CI build stages, or wrapping the web build as a Tauri 2 desktop app (Windows / macOS) with a Node sidecar and signed updates.
---

# Ship Rust inside the JS app (WASM door, then desktop)

**REQUIRED BACKGROUND:** `rust-mixed`. The crate must already be golden-equal (`rust-mixed-port`).

## 1. WASM crate (`crates/<app>-wasm`)

`crate-type = ["cdylib", "rlib"]`, `wasm-bindgen = "=<exact version>"` (pin; the CLI must equal it). One
`#[wasm_bindgen]` function per area, **JSON text in, JSON text out**. Every error returns
`{"error": "...", "unsupported": true}`; never panic across the boundary. Refuse inputs that would exhaust wasm memory.

```rust
#[wasm_bindgen]
pub fn solve(input: &str) -> String {
    let v: serde_json::Value = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => return refuse(format!("bad JSON ({e})")),
    };
    match <app>_core::solve_json(&v) { Ok(out) => out.to_string(), Err(e) => refuse(e.to_string()) }
}
fn refuse(why: String) -> String { serde_json::json!({ "error": why, "unsupported": true }).to_string() }
```

Build script `scripts/build-engine-wasm.mjs` (copy Solvarium's): checks cargo, `wasm32-unknown-unknown` target and the
exact wasm-bindgen CLI (exit 2 + the install command when missing), `cargo build --release --target
wasm32-unknown-unknown -p <app>-wasm`, `wasm-bindgen --target web --no-typescript --out-dir src/engine/wasm/pkg`.
`pkg/` is gitignored: the app must build and run without it.

## 2. The door (`src/engine/engineApi.js`)

One module every call site uses. Per area: Rust when loaded and enabled, else the JS function. Record which ran.

```js
import { solve as solveJs } from './engine.js';
let pkg = {}; try { pkg = import.meta.glob('./wasm/pkg/<app>_wasm.js'); } catch { /* Node: engineApi.load(mod) */ }
let wasm = null, loading = null;
const flagOn = () => {
  const pick = (get) => { try { const v = get(); return v === 'js' ? false : v === 'wasm' ? true : null; } catch { return null; } };
  return pick(() => new URLSearchParams(globalThis.location?.search || '').get('engine'))
      ?? pick(() => globalThis.localStorage?.getItem('<app>.engine')) ?? DEFAULT_ON; // false at RS-WASM.1, true at .3
};
export const engineApi = {
  lastEngine: 'js', lastFallbackReason: null, flag: null,
  enabled() { return this.flag ?? flagOn(); },
  load(mod) {
    if (mod) { wasm = mod; return Promise.resolve(true); }
    const imp = Object.values(pkg)[0];
    if (!imp) return Promise.resolve(false);
    return (loading ??= imp().then(async (m) => { await m.default(); wasm = m; return true; }).catch(() => false));
  },
  solve(input) {
    const why = !this.enabled() ? 'opted out' : !wasm ? 'wasm not loaded' : null;
    if (!why) {
      try {
        const out = JSON.parse(wasm.solve(JSON.stringify(input)));
        if (!out.unsupported) { this.lastEngine = 'wasm'; this.lastFallbackReason = null; return out; }
        this.lastFallbackReason = out.error;
      } catch (e) { this.lastFallbackReason = String(e); }
    } else this.lastFallbackReason = why;
    this.lastEngine = 'js';
    return solveJs(input);
  },
};
```

- **No bundler (plain `<script>` pages)**: build with `wasm-bindgen --target no-modules` (global `wasm_bindgen`), make the
  door a classic script (`root.ENGINE = {...}`) loaded after the JS core, start `wasm_bindgen('wasm/<app>_wasm_bg.wasm')`
  on load; calls stay synchronous, the JS answers until it resolves. Switch every caller to the door.
- Convert JS-only shapes (Set, Map, typed arrays, key order) back in the door so callers see the JS result exactly.
- Refuse in JS what JSON would change: non-safe integers, `NaN` / `Infinity`.
- Call once per run in blocks, never per cell. Long searches: a stepper object (`new SearchRun(json)` + `step()`) in a
  Web Worker; the page passes the flag into the worker.
- **Next.js**: client side, put `pkg/` under `public/` or use `import()` in a client component (`'use client'`); server
  side / Express, build a second package with `--target nodejs` (or `--target web` + `initSync(bytes)`). napi-rs only
  when wasm is measured too slow on the server.
- `scripts/test-engine-wasm.mjs`: build the package, load it in Node (`engineApi.load(mod)`), every golden case through
  the door equals the JS function; fallbacks (refusal, package missing, opted out) answer with JS. SKIP without tools.

Rollout: RS-WASM.1 flag default off (`?engine=wasm` on) -> .2 worker / stepper -> .3 default on, `?engine=js` opts out.

## 3. Build pipeline

- Dockerfile: a `wasm` stage `FROM rust:<pinned>-slim-bookworm`, `rustup target add wasm32-unknown-unknown`, wasm-bindgen
  release tarball checked against its sha256, `cargo build --locked`; copy `pkg/` in before `npm run build`; fail the image
  build when `dist/assets` has no `.wasm`. Serve `.wasm` as `application/wasm`.
- CI: same pinned toolchain, build the package before the web build, run `test:engine-rs` and `test:engine-wasm`.
- Static host (Hostinger, Netlify, GitHub Pages): add the `pkg/` / `wasm/` folder to the upload list and serve `.wasm` as
  `application/wasm` (`.htaccess`: `AddType application/wasm .wasm`; Netlify `_headers`).
- A single-file / `file://` build cannot lazy-load wasm: it runs the JS engine. Say so in its docs.

## 4. Desktop (RS-DESK, Tauri 2)

- `crates/<app>-desktop`, **excluded** from the workspace. Window loads the same web `dist/`; no UI rewrite.
  No build step? A staging script copies only the deployed files into the folder Tauri packages; set the start page if it
  is not `index.html`.
- Offline: vendor every CDN script and font the pages load. Browser `localStorage` data does not carry over to the
  WebView: offer project export / import (or file save) before users switch.
- Windows needs the MSVC toolchain (`rustup override set stable-x86_64-pc-windows-msvc` in the checkout), VS 2022 Build
  Tools C++ workload, WebView2; `cargo install tauri-cli --version "^2" --locked`. Build: web build, then
  `cargo tauri build` -> NSIS / MSI; macOS dmg from the same config on a Mac / CI runner.
- App with a Node API (Express, Next.js server): ship it as a sidecar (Node SEA binary), bound to `127.0.0.1` on a
  stored free port, data / keys in the app data dir, a start page until the server answers. Static app: no sidecar.
- Native engine in desktop: call the Rust crate through a Tauri `invoke` command only if the wasm path is measured too
  slow; otherwise the same wasm runs in the WebView.
- Updates: Tauri updater only with a signed feed (release key outside the repo, public key as a build variable);
  check size + SHA-256 before install; updater off without both variables. Code-signing identities never committed.
- CI `desktop.yml` (manual or `v*` tag): fmt, clippy -D warnings, test, `cargo audit`, installers, silent-install e2e.

## Done means

Door equals JS on every golden case (`test:engine-wasm` green, not SKIP); app builds and runs with `pkg/` deleted;
opt-out works; Docker / CI build the wasm; desktop installer starts and reaches the UI (when RS-DESK is in scope);
nothing left running that you started.
