# Changelog

## Unreleased

## 1.0.0 (2026-11-23)

- New build plugin under the old name. Takes any canvas (Claude Design, spec-to-canvas generator, HTML canvas, Hub Studio, Figma, screenshots) into the app: manifest, architecture map, contract per screen, gate baseline, test-first build per screen, State gate, independent review, memory.
- `scripts/gate.mjs`: baseline and check of the repo's own gate; fails on new failures only, with a self-check.
- The drawing plugin that held this name up to 0.6.0 is now `spec-to-canvas`; its Phase 6 (Build) and State gate moved here.
