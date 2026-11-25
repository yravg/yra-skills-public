---
name: iwantthis-fromvideo
description: >-
  Use when given a screen recording or video of a feature in another app and
  asked to recreate it in our own app: reverse-engineer the video (screens,
  workflow, animations, data), ask the design and feature-parity questions, then
  produce a PRD (plus roadmap and canvas when the scope is big) or build it
  directly.
---
# /iwantthis-fromvideo

Turn a video of someone else's feature into a working feature in our app (for example Solvarium at solvarium.yraveragehub.io).

## Inputs
- The video file, or a URL to it (YouTube, Loom, a screen recording).
- The target app's repo or URL.
- Optional: a note on what the user likes about the feature.

## 1. Extract what the video shows (reanimate-style)
1. Read the basics with `ffprobe`: duration, fps and resolution.
2. Find scene changes: `ffmpeg -i in.mp4 -vf "select='gt(scene,0.3)',showinfo" -vsync vfr frames/scene_%04d.png`. Also save one frame every 0.5 to 1 s so slow changes aren't missed.
3. For each animation, take frames at the full frame rate around it. Measure its start, end, duration and distance moved, and guess the easing (linear, ease-out or spring) from how the position changes frame to frame. Use the approach in github.com/NiazMorshed2007/reanimate, which measures motion timing from video.
4. If the video has audio, transcribe it (for example with whisper). Read any text on screen with OCR (tesseract) or by looking at the frames.
5. Write `VIDEO-BREAKDOWN.md`. Include:
   - A timeline, with timestamps, of each user action and what the screen does in response.
   - A list of every screen and panel, with its layout and the exact label text.
   - Every component (buttons, menus, inputs, tables, charts, Gantt bars, dialogs), with its states (default, hover, active, disabled, empty, loading, error).
   - The data model the screens imply: entities, fields, calculations and rules.
   - The workflow as numbered steps, with a mermaid diagram.
   - Animation specs: what moves, duration in ms, easing, delay and order.
   - Anything left unclear, marked as a guess.

## 2. Study the target app
1. Read the repo and find the stack, the design tokens or theme, the shared components, the routing, the state handling and the data layer.
2. Find where the feature belongs: which page, menu, panel or engine.
3. List any existing code the feature overlaps with or can reuse. List anything that would conflict.

## 3. Ask the user before designing (required)
Ask these in one message and wait for the answers:
1. Design: should it follow our design tokens and components, or copy the look in the video?
   - a) Our tokens and components only. Match the video's layout and behaviour, not its styling.
   - b) A close visual copy of the video (colours, spacing, icons).
   - c) A mix. Say which parts copy the video.
2. Features: how close to the video should it be?
   - a) 100% the same, including the exact workflow, steps and screens.
   - b) The same features, but with the workflow adapted to how our app already works.
   - c) Only the core feature. Say what to leave out.
   - d) The video's features plus extras. Say which.
3. Animations: copy the video's timings exactly, or use our motion tokens?
4. Data: should it use the data and engine we already have, or does it need new fields or tables?
5. Scope: write the docs only, or also build it?
6. Anything in the video they dislike or want done differently.
If the user already answered any of these, don't ask again. Never copy another company's logos, brand names or written copy.

## 4. Pick how much to produce
- Small (one component or screen, under about 1 day): write a short PRD, then build it.
- Medium (several screens or a new workflow): write a full PRD and a roadmap, then build phase 1.
- Large (a new module, an engine change, or a lot of unknowns): write the PRD, the roadmap and a canvas mockup, then wait for the user to approve before building.
If the user named an option in step 3, use that one.

## 5. Deliverables
- `PRD.md` (with HTML and PDF copies when the user wants them):
  - Goal and user stories.
  - Functional requirements with ids (FR-01 and so on).
  - The workflow and screen specs, citing video timestamps and frame images.
  - The data model and API changes.
  - Animation specs.
  - Acceptance tests.
  - Open questions.
  - A parity table: each element seen in the video, whether we copy, adapt or skip it, and why.
- `ROADMAP.md`: phases, with build cards giving each card's files, effort and test.
- A canvas or HTML mockup made with our tokens, for medium and large work.
- `HANDOFF.md`: the entry point for the coding session. Include the order to work in, the files to touch, and how to test.
- A `frames/` folder with the key frames referenced by the PRD.

## 6. Build (when asked)
1. Work on a branch. Make one commit per roadmap card, each with its test.
2. Use our components and tokens, unless the user chose option b) in step 3.
3. Check the result against the video side by side, on both behaviour and timing. Record a short screen capture of our version and compare it frame by frame with the original animations.
4. Report what matches the video, what differs and why, and what you couldn't check.

## Rules
- Write plainly and specifically. No filler.
- Don't push or deploy without the user's OK.
- Keep the user's private data out of the outputs.
