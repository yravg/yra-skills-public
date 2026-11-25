# Rust candidates per app (from the SaaS Readiness Atlas, 14 Oct 2026)

Source: an audit of the owner's apps. Re-check the code before
acting: this is a reading of stack and purpose, not a profile. Highest value first.

| App | Path | Rust core (crate) | Desktop (RS-DESK) | Verdict |
|---|---|---|---|---|
| SchedMate / Solvarium | `Solvarium` | done: core, cpm, airl, opt, fields, fuse, sprj, wasm | Tauri 2 + Node SEA sidecar, signed updater | reference implementation |
| yraverageMilestone | `yraverageMilestone` | tested 2026-10-19: first slice `SCHED.critical` + calendar helpers (`schedule-core.js`), then `TRACK.progressOf`, then EV `curves` (`ev-core.js`). Excel import stays JS (SheetJS). Blockers: `critical` returned as Set, local-time date maths, `propagate` / `summarize` mutate in place. Semantics differ from `solvarium-cpm` (inclusive date strings, milestone = 1 day, float clamped >= 0): owner picks a Milestone profile inside Solvarium `engine-rs` or its own area. Plain scripts, no bundler: door = `engine-api.js` global, `wasm-bindgen --target no-modules`; gates in `tools/*.test.mjs`; Hostinger needs `.wasm` MIME | yes, no sidecar; vendor SheetJS / PptxGenJS / fonts; start page `Landing.dc.html`; browser `localStorage` projects do not carry over (add export / import) | small projects: Rust buys little; desktop is the real reason. Measure first |
| Thesis Weather Scheduler | `Thesis Weather Scheduler` | typhoon exposure score: a Solvarium area after validation | via Solvarium | fold into Solvarium |
| yraverageDCS | `yraverageDCS` | maybe Import Center parsing / Document Log two-source diff if it is slow on big registers; measure first | yes: replace the Electron shell with Tauri 2 (smaller installer, signed updater); Next.js server as sidecar | desktop first, core only if measured |
| SubMeetly | `yraverageSubMeetly` | the Python Whisper helper could become a Rust native helper (whisper-rs); not WASM; transformers.js stays in the extension | the helper ships inside a Tauri tray app | high effort, only after licence sales |
| Marine Transit Calculator | `Marine Transit Calculator` | small pure calc; Rust not worth it | Tauri shell if sold as a per-company tool (fix bind 0.0.0.0 + client data first) | desktop only, optional |
| yraverage Hub, IUL FnB, Padel Kita | `yraveragehub`, `iul fnb`, `padel-kita` | none: CRUD / billing / booking (Padel's double-booking guard is a Postgres EXCLUDE constraint, already right) | no | no Rust |
| Animator, agentic-os, ClaudeModsManager, MuslimCalendar, wikigraph, planlab.ai, airl prototype, my-mastra-app | - | none | no | no Rust |

Shared-crate rule: scheduling maths (CPM, calendars, levelling, drag) lives once, in Solvarium `engine-rs`. Another app
uses it as a path / git dependency or a copied, versioned wasm package; it never forks a second CPM. When the app's
rules differ (date semantics, float clamping), add them as an option / profile of the shared crate with its own golden
file, after the owner agrees; ask, do not decide alone.
