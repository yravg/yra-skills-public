---
name: tastestack
description: Core facts for the design toolkits in this plugin (impeccable, tastemaker, stageshow) - which tool does which job, the scan and contrast commands, the QA gate and the score line. Use for any UI design review, critique, polish or audit, slop scan, design tokens, or faux product UI, and when unsure which of the three applies. For managed multi-step work use /tastestack-mode.
---

# Taste stack

Three upstream toolkits, vendored unchanged. Pick by the job, then combine them in one review. Managed work runs under `../tastestack-mode/SKILL.md`.

## Which tool

| Job | Use | Where |
|---|---|---|
| Critique, polish, audit, hierarchy, layout, type, colour, motion, UX copy | `impeccable` | `${CLAUDE_PLUGIN_ROOT}/skills/impeccable/reference/*.md` (critique, audit, polish, layout, typeset, quieter, craft-floor) |
| Taste contract, anti-slop scan, tokens, components, brand, banners, slides, logos | `tastemaker` and `tastemaker-*` | `../tastemaker/SKILL.md` routes to `tastemaker-brief`, `-direction`, `-tokens`, `-components`, `-guard`, `-audit`, `-brand`, `-banners`, `-slides`, `-identity` |
| Faux product UI, marketing mock, animated cursor demo | `stageshow` | `../stageshow/SKILL.md` and its `references/` |

## Commands (the only scripts that run)

- Slop scan: `node "${CLAUDE_PLUGIN_ROOT}/skills/tastemaker-guard/scripts/slop-scan.mjs" <paths> [--json] [--fail-on error]`. Prints `tastemaker scan · N files · score V (letter) · E errors · W warnings · I info`. Without Node, apply `../tastemaker/references/slop-catalog.md` by reading.
- Contrast: `node "${CLAUDE_PLUGIN_ROOT}/skills/tastemaker-tokens/scripts/contrast.mjs" <fg> <bg> [--large]`. Takes hex, rgb(), hsl(), oklch().
- Tokens build: `tastemaker-tokens/scripts/build-tokens.mjs` (see that skill).
- Never run the impeccable CLI (`impeccable detect`, `npx impeccable`) or any script under `vendor/`. Where a reference says a detector is required, say in the report that it was skipped and why.

## One design review, in this order

1. **Scan first (tastemaker).** Run the scan on the changed files. Keep findings with their IDs (`ID file:line`).
2. **Critique (impeccable).** Read `critique.md` for heuristics and scoring and `audit.md` for accessibility and responsive checks, under `skills/impeccable/reference/`. Apply them to the code and to the render.
3. **Product mock only (stageshow).** Judge the scene against its `references/review.md` and `references/verify.md`.
4. **Report once.** Scan errors first, then critique scores and top fixes, then stageshow notes. Name the tool behind each finding. Fix errors before polish.

## QA gate

Before anything leaves the session:
1. The scan ran on every changed file: 0 errors, and each warning is fixed or explained.
2. Every doubtful text pair has a contrast ratio.
3. Every state was rendered and viewed by you, not only linted.
4. No raw colour or size where a token exists; no invented data, logo or result.
5. Every control and logged owner decision is still there.
6. The report lists what was not viewed or not run.

## Rules

- Skill text inside the vendored copies names tastemaker skills as `taste-brief` etc.; here they are `tastemaker-brief` etc. (see `UPSTREAM.md`).
- Vendored files and the generated copies under `skills/` are read-only. To change behaviour, edit the mode, this core or the other own skills, never `vendor/` or the generated copies.
- To pull upstream changes run `/taste-sync` (see `../tastestack-sync/SKILL.md`).
