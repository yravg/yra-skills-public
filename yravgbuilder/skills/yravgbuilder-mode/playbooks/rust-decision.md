### Rust decision

**Answer "should this move to Rust?" with a measured verdict.**

1. Read `../../yravgbuilder-rust/SKILL.md` section 1. List the candidate functions.
2. For each candidate: is it pure, heavy or cross-platform-exact, and does it have a JS oracle? Note file:line.
3. Time the largest real input in the browser and in Node. Record the numbers.
4. Verdict per candidate: port (card `RS-<AREA>.1`), make port-ready first, or no Rust candidate. Desktop-only need: Tauri with the JS core.
5. If port: add the cards to the roadmap. Do not write Rust in this playbook.

**Reply:** table of candidate, measurement, verdict and reason; the cards proposed; what was not measured.
