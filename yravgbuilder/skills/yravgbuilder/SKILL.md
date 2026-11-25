---
name: yravgbuilder
description: Core house standard for building enterprise and business apps the yravg way - the default stack (JS/TS UI, Rust only for pure heavy cores, Tauri for desktop), where the design system and reference code live, the tastestack bridge, and the QA gate every screen, feature and port must pass. Use for /yravgbuilder, when starting or reviewing any business app UI, choosing a stack, deciding Rust vs JS, or when unsure which yravgbuilder leaf applies. For managed multi-step work use /yravgbuilder-mode.
---

# yravgbuilder

The house standard distilled from Solvarium, the yravg UI catalogue, and the tastestack plugin. Managed work runs under `../yravgbuilder-mode/SKILL.md`.

## Default stack

| Layer | Default | Rule |
|---|---|---|
| UI | Vite + React, plain JS/JSX or TS | Never rewrite UI in Rust (no egui, Dioxus, Leptos). |
| Design system | yravg catalogue (B1 Clean by default) | Reuse the real source; never a look-alike. `../yravgbuilder-ui/SKILL.md`. |
| Logic | Pure modules with a contract header | Pure core, thin view. `../yravgbuilder-feature/SKILL.md`. |
| Heavy core | Rust crate in `engine-rs/`, WASM in a Worker | Only when pure + heavy (or must match across platforms) + has a JS oracle. `../yravgbuilder-rust/SKILL.md`. |
| Server | Node (Express or plain http) | Auth, DB, CRUD, email, billing stay JS/TS. |
| Desktop | Tauri 2 around the same web build | `../yravgbuilder-rust-ship/SKILL.md`. Same WASM first; `invoke` only when measured too slow. |

## Which leaf

| Job | Leaf |
|---|---|
| Screen look, tokens, components, states, icons, a11y, slop checks | `yravgbuilder-ui` |
| Feature from PRD row to shipped (contract, tests, samples, how-to, changelog, canvas first) | `yravgbuilder-feature` |
| Should this move to Rust; workspace; card scheme | `yravgbuilder-rust` |
| Port one JS function with golden files and the Rust gate | `yravgbuilder-rust-port` |
| WASM door with JS fallback, CI/Docker, Tauri desktop, updater | `yravgbuilder-rust-ship` |

## Reference code (read before writing your own)

- UI catalogue: `src/own/<section>/<name>[.tN].tsx` (+ `.json`) in the yravg UI catalogue. CLI: `npx -y https://uiux.yraveragehub.io/cli/yravg-ui-0.2.0.tgz search|recommend|info|add <query>`. Live: https://uiux.yraveragehub.io.
- App-side pieces built on it: `app/src/design/ui` in the Solvarium repo (Select, Tabs, Segmented, Table, KpiTile, StatusPill, EmptyState, Skeleton, Field, Input).
- Rust door and gates: `Solvarium\app\src\engine\engineApi.js`, `Solvarium\app\scripts\{gen-engine-golden,test-engine-rs,build-engine-wasm,test-engine-wasm}.mjs`, `Solvarium\engine-rs\`.
- Feature contract: `Solvarium\.claude\skills\feature-standard\SKILL.md`.
- Never copy Solvarium client data, golden files or fixtures into another repo.

## tastestack bridge

tastestack (`tastestack@yra-skills-public`) owns scan, contrast and critique. Call it; do not re-implement it.

- Skills: `tastestack:tastestack` (which tool, QA gate), `tastestack:tastemaker-guard` (slop scan), `tastestack:tastemaker-tokens` (contrast, tokens), `tastestack:impeccable` (critique rules). Design-only work: hand it to `/tastestack-mode`. Delegate a design check: `subagent_type` `tastestack:tastestack-agent`.
- Find the plugin root once per run: `ls -d ~/.claude/plugins/cache/yra-skills-public/tastestack/*/` and take the newest version; none, use the tastestack directory in a yra-skills-public checkout. Never a recursive Glob over `~/.claude/plugins` (it times out). Call the root `<ts>`. Never use the copies under `<ts>/vendor/`.
- Slop scan: `node "<ts>/skills/tastemaker-guard/scripts/slop-scan.mjs" <changed files> --fail-on error`. Quote its `score N (letter) · E errors · W warnings` line.
- Contrast: `node "<ts>/skills/tastemaker-tokens/scripts/contrast.mjs" <fg> <bg> [--large]`. Quote the ratio.
- Critique: read `<ts>/skills/impeccable/reference/critique.md` and `audit.md`. Never run the impeccable CLI.
- Neither path exists: apply `../yravgbuilder-ui/references/slop-checklist.md` by reading, and say the scan was skipped.

## QA gate

Before anything leaves the session:
1. Reuse checked: catalogue and repo searched first; each new component has a one-line reason it could not be reused.
2. Tokens only: no raw hex, rgb or px value where a token exists (Canvas, SVG, PDF and Excel code excepted).
3. Every state drawn: default, hover, focus-visible, active, disabled, loading (skeleton), empty (purpose + next action), error (what failed + what to do), long content, light and dark.
4. No invented data: real source, or sample data that is labelled as a sample in the UI and ships as a demo.
5. No dead control: every button does something real, or it is not on the screen. No control removed for looks.
6. Slop scan ran on every changed file: 0 errors, each warning fixed or explained. Doubtful text pairs carry a contrast ratio.
7. Rendered and viewed by you at 1440, 1024 and 390 px, keyboard only, dark mode. A passing script is not a view.
8. Logic: pure core with contract header, a hand-computed test that failed first, suite wired into the test runner and CI.
9. Rust change: golden-equal to the JS oracle (0 mismatches), fmt + clippy `-D warnings` + test + doc green. A SKIP is not a pass.
10. CHANGELOG entry under Unreleased; user-visible feature has its how-to and sample.
11. The report lists what was not viewed or not run.
