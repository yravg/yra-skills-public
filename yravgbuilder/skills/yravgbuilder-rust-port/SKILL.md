---
name: yravgbuilder-rust-port
description: Use when porting a JavaScript / TypeScript function or engine area to Rust in an engine-rs workspace, writing golden files from the JS reference, adding a Rust crate, or wiring the Rust gate (fmt, clippy -D warnings, cargo test, cargo doc) into npm test and CI. Also when a Rust result differs from the JS one.
---

# Port one area to Rust (golden first)

**REQUIRED BACKGROUND:** `yravgbuilder-rust` (what moves, card scheme, workspace template).

The JS function is the oracle. Rust must equal it exactly: numbers, nulls, strings, rounding, key order. A slice is done
when the gate is green on this machine, not SKIPPED.

## Steps

1. **Read the JS function and every helper it calls.** What it reads from input = the Rust input struct (serde).
2. **Golden generator.** `scripts/gen-engine-golden.mjs` imports the JS function and writes
   `engine-rs/golden/<area>.json` = `{ cases: [{ label, input, output }] }`: hand-made edge cases, demo data, seeded
   synthetic fuzz (state the seed). `--check` regenerates in memory and exits 1 on drift. Never hand-edit the file.
   Plain-script app (globals, no modules)? Load the core the way its tests do (`vm.runInThisContext` with the needed
   globals) and call it from there. Run the generator with `TZ=UTC` if the JS touches dates.
3. **Failing Rust test.** `crates/<app>-<area>/tests/<area>.rs` loads the file, runs every case, compares every field,
   names the `label` in each failure. Watch it fail.
4. **Port until green.** Then refuse what you did not port (typed error) and add one golden case per refusal.
5. **Gate + CHANGELOG + commit** with `PRD: RS-<AREA>.<n>`.

## Rust rules (equal to JS, byte for byte)

- `Result<T, AreaError>`: an `enum`, one variant per refusal, `impl Display` (short sentence, same text JS throws) and
  `impl std::error::Error`. No `thiserror` / `anyhow` in libraries. Never panic on input: `.get(i)`, `try_from`, no
  truncating `as` on input values.
- `Vec` / `BTreeMap` only; `HashMap` for lookups, never iterated. Stable sorts (`sort_by`), never `sort_unstable*`.
  If JS sorts with an inconsistent comparator, port V8's sort (Solvarium `solvarium_airl::timsort`).
- f64 in the JS operation order; no `mul_add`, no algebra rewrites. `Math.round(x)` = `(x + 0.5).floor()`.
  No `powf` where OSes must agree (JS `Math.pow` differs per OS too: change the JS to `*` / `sqrt` first, owner decides).
- Seeded RNG ported bit-exact (`u32` wrapping), no `rand`, no time. Integers stay integers.
- `serde_json` with `float_roundtrip`. Few deps; each must build for `wasm32-unknown-unknown`.
- `//!` header per file: which JS function it ports and what it does not cover. `///` on every `pub` item with units
  and errors.
- `#[allow(..., reason = "...")]` only; golden test crates may allow `expect_used` / `panic` at their root.

## Golden test shape

```rust
//! Golden: `<fn>` equals the JS `<fnJs>`. Regenerate: node scripts/gen-engine-golden.mjs
#![allow(clippy::expect_used, clippy::panic, reason = "golden test helpers fail the test")]
use serde_json::Value;

fn golden() -> Value {
    let p = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../golden/<area>.json");
    let t = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{}: {e}", p.display()));
    serde_json::from_str(&t).expect("golden JSON")
}

#[test]
fn equals_js() {
    for c in golden()["cases"].as_array().expect("cases") {
        let got = <app>_<area>::run_json(&c["input"]);       // the Rust result as JSON
        assert_eq!(got, c["output"], "case {}", c["label"]);  // compare -0 as 0 if JS emits it
    }
}
```

## Gate script (`scripts/test-engine-rs.mjs`, copy from Solvarium `app/scripts/test-engine-rs.mjs`)

Order: `gen-engine-golden.mjs --check` (always runs), then, when cargo exists (PATH or `~/.cargo/bin`):
`cargo fmt --all --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo test --workspace`,
`cargo doc --workspace --no-deps` with `RUSTDOCFLAGS=-D warnings`. Prints `PASS` / `FAIL` per step, `SKIP` + exit 0
without cargo, `engine-rs: all green` at the end. Add it where the repo's tests run (`"test:engine-rs"` in package.json
+ fast `npm test` list, or a file the existing test loop picks up, e.g. `tools/engine-rs.test.mjs`) and to CI (`dtolnay/rust-toolchain@master` with the pinned version, `Swatinem/rust-cache`) in the same commit.

## Mismatch on real data

Fix it (rule from evidence, synthetic hand-computed test that fails first) or certify it in code (the source tool's
own data contradicts itself). A guess that fits is marked `ASSUMED:` with its support count. Real-file gates read paths
from env vars and SKIP without them; they print counts, never client codes.

## Red flags

- "Close enough" float differences: find the operation-order or rounding difference, do not add tolerance.
- Editing a golden file by hand, or regenerating it to make Rust pass without reading the JS diff.
- `HashMap` iteration, `sort_unstable`, `unwrap()` in library code, `panic!` across the wasm boundary.
- Reporting done with the cargo steps SKIPPED.

## Done means

Golden file generated and committed, `--check` clean; Rust equals every case; `engine-rs: all green`; CHANGELOG line
with case / cell counts; README crate cell; own diff reviewed for bloat; pushed.
