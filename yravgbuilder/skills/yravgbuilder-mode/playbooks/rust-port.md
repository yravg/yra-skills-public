### Rust port

**Port one JS function or area to Rust, golden-equal, behind the door.**

1. Read `../../yravgbuilder-rust-port/SKILL.md`. Confirm the JS core is port-ready (`../../yravgbuilder-rust/SKILL.md` section 2).
2. Extend the golden generator from the JS oracle. Write the Rust test and watch it fail.
3. Port until 0 mismatches. Refuse unported inputs with a typed error and one golden case each.
4. Add the wasm function and the door call with JS fallback (`../../yravgbuilder-rust-ship/SKILL.md`).
5. Run the gate: golden `--check`, fmt, clippy `-D warnings`, test, doc, and the wasm-through-door test.
6. Add the line to `engine-rs/CHANGELOG.md` (what equals what, case count, mismatches = 0). Commit with `PRD: RS-<AREA>.<n>`.

**Reply:** card, golden cases and mismatches, gate output, door flag state, commit SHA, what was not ported.
