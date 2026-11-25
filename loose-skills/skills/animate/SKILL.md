---
name: animate
description: Build HyperFrames (HTML to MP4) videos with the Animate workflow - presenter reels in 9:16 or 16:9, motion graphics, real 3D, editable infographics and the eight-reel wall - from the RUBRIC Elements library, registering every new element back into it. Use when the user says "animate", "/animate", "hyperframes", "html to mp4", "render this", "motion graphics for [recording]", "storyboard a video", "cut this footage", "make a reel", "landscape version", "vertical version", "create an element", "register this asset", or asks what reusable elements exist. Also fires for generation routing inside a video job (which tool makes the images or the video).
---

# Animate

Build organised HyperFrames videos from reusable elements, and leave the library richer than you found it. One principle: every scene is a pure function of scene-local time, so previews, scrubs and renders agree.

| Doing... | Read | Covers |
|---|---|---|
| A presenter reel, portrait or landscape | [reel-production.md](references/reel-production.md) | type, palette, layouts, resources, 3D, hooks, beats, audio, proof |
| Any other composition, storyboard or render | [production-manual.md](references/production-manual.md) | four phases, lint rules, footage prep, motion patterns, CLI |
| Words on screen | [motion-copy.md](references/motion-copy.md) | hook, subtitle and CTA copy rules |
| The eight-reel wall | [eight-reel-wall.md](references/eight-reel-wall.md) | reuse of the approved template |
| Finding or registering an element | [element-library.md](references/element-library.md) | categories, previews, register and rebuild commands |
| Creating a new element | [creating-elements.md](references/creating-elements.md) | the element contract, quality bar, registration |
| Checking your work | [evals.md](references/evals.md) | acceptance prompts with observable checks |

Read only the file for the job in hand.

## Universal rules (never skipped)

1. **Every new asset, element or component goes into the elements library before the job is called done** (the library is the shared memory of what exists; unregistered work gets rebuilt from scratch next time). Register with the library's register script, then rebuild the page. Generated images, Broll clips, SVGs, 3D objects, backgrounds, sounds and reusable compositions all count.
2. **Look in the library before building** (a preview takes seconds, a rebuild takes an hour). Hover a card to preview it; Add copies an agent-ready selection with source paths and configuration.
3. **Scene-local time drives everything** (the renderer seeks, so anything that accumulates state or uses timers, random values or the clock drifts between preview and render). `renderAt(t)` and GSAP timelines only.
4. **Links, never tabs** (the user decides when a browser opens). Validate headless, return paths, URLs or screenshots.
5. **One folder per video, one common folder for shared masters** (portable projects, no duplicate media). Scaffold with `scripts/prepare-video-folders.mjs`.
6. **Generation routing.** For generated video (Broll, clips): use the `/generate` skill from the RoboNuggets community (https://www.skool.com/robonuggets), which owns model choice, cost and logging. For generated images: use your agent's native image generation; if your agent runs on a GPT model (Codex, ChatGPT), that is ChatGPT's native image generation. Never present a generated concept as a real screenshot.

## Workflow

1. **Brief.** Confirm count, format (9:16, 16:9 or both), review depth (screenshots first, or straight to finished files) and delivery. Done when each has an answer.
2. **Prepare footage** (presenter reels only). Transcribe, cut for speech-safe boundaries, re-encode with 1-second keyframes; see source preparation in the production manual. Done when `assets/source.mp4` plays clean at true 30 fps.
3. **Plan the batch.** Write the opening, layout sequence, infographic structure and motion pattern for every video before building, and vary them across the batch. Done when no two videos share an opening or an infographic scaffold.
4. **Pick elements.** Open the library, preview, Add. Build only what is missing, using the element contract. Done when every planned scene names its elements.
5. **Compose.** One composition per video from `templates/composition-template.html`: scenes under 6 seconds, transitions 0.4 seconds with sharp ease and moving blur. Done when lint passes with 0 errors.
6. **Preview.** Headless screenshots at representative times; a Studio tab only on request. Done when the user has approved, or asked for finished files directly.
7. **Render and verify.** Check dimensions, frame rate, duration, full decode, audio peaks and the two-word subtitle cap on every frame. Record renderer time. Done when every requested output exists and passes.
8. **Register and hand back.** Register new elements (rule 1), save provenance, return paths. Done when the library rebuild shows the new cards in both aspects.

## Landscape vs vertical

One workflow. Shared: type, palette, 0.4-second transitions, 6-second scenes, 65% presenter coverage, true 30 fps footage with 15 fps animation sampling, one generated image per video, quoted CTA keywords. What changes:

| | Vertical 9:16 (1080x1920) | Landscape 16:9 (1920x1080) |
|---|---|---|
| Opening | Split layout with a short kinetic hook, a real resource, an infographic transformation or a native illustration; vary across the batch | Full-screen real footage with no hook text; the same playing layer then slides into the right plate |
| Split layout | Animation above, square presenter plate below | Animation left, presenter right |
| Presenter plate | 952x952 at (64,868), radius 64, soft white outer glow | 820x820 at (1040,98), radius 54, soft white outer glow |
| Full-screen footage | Native portrait footage or a centred 9:16 crop, no frame | 16:9 source crop scaled uniformly, no frame; save the rectangle in `PRESENTER.json` |
| Subtitles and titles | Subtitles 68-76 px, titles 96-116 px, centred | Same starting sizes, kept clear of the presenter plate; shorten copy before shrinking |
| Infographics | Above the presenter; full-screen only for large or complex diagrams | Left of the presenter; full-screen only with a readability reason |
| 3D preview scale | About 0.7 on the portrait camera | About 1.15 on the landscape camera |
| Generated Broll | Generate native 9:16, never stretch | Generate native 16:9 |
| Brand or product film | Only with a vertical brief | The default home; no presenter required, no opening hook text |

Recompose, never stretch. Build both aspect variants for any reusable element.

## Locked motion defaults

- New elements move in **0.4 seconds** with sharp acceleration and deceleration (expo.inOut) and strong moving blur that returns to zero at both settled endpoints, because a crisp hold after a fast move reads as intent rather than as a crossfade.
- **Real 3D** turns once around Y over 0.5 seconds, fades in over 0.1 seconds with no entry blur, then drifts at most 30 degrees. Each 3D appearance lasts at most 3 seconds, because geometry is punctuation, not a scene.
- **Text backing**: big headline text and hero numbers sit directly on the scene with no backing shape or black box; every other authored text background uses 80 percent fill opacity with fully opaque text; subtitle plates are exempt only outside full-screen presenter scenes; native text inside captured websites stays as captured, because a box behind a headline reads as a slide, not a scene.
- **Full-screen presenter text**: In full-screen presenter scenes, the footage stays unobscured: no panel, gradient wash or text background, including subtitle plates. Use compact two-line headlines (about 1.08 line height, no extra inter-line margin) and tight CTA spacing.
- **Hero numbers** below 100 show immediately; 100 and above count over 0.5 seconds to the script-supported value and hold. Approximations stay approximate ("1,000s").
- **Presenter footage stays true 30 fps; animation samples at 15 fps** with `Math.floor(mediaTime * 15) / 15`, because quantising the media clock stutters the face.
- **Source cuts** leave 0.2-0.3 seconds between spoken beats and at least 0.1 seconds around audible speech; complete words beat the pause target.
- **Scenes follow the script**, at most 6 seconds including transitions. Never hard-switch or crossfade presenter crops.
- **Background** is the dot-matrix wave at 30% effective opacity over warm paper, sampled from timeline time.
- **Music** sits at a constant gain with no ducking; the four house sound effects keep their saved gains and must be audible in the final mix, not only logged.

## Resources

- `references/reel-production.md` - the complete visual direction for presenter reels and brand films. Open for any reel.
- `references/production-manual.md` - HyperFrames phases, lint rules, footage prep, the motion pattern library, CLI cheatsheet and pitfalls. Open for compositions, ports and renders.
- `references/motion-copy.md` - copy rules for hooks, subtitles and CTA lines.
- `references/eight-reel-wall.md` - how to reuse `templates/eight-reel-wall.html` without breaking its geometry.
- `references/element-library.md` - the library: categories, preview behaviour, register and rebuild commands.
- `references/creating-elements.md` - how to make a new element that previews, renders and registers cleanly. Pair with `templates/element-template.html`.
- `references/evals.md` - acceptance prompts. Run after changing the skill.
- `templates/` - composition template, storyboard templates, eight-reel wall, element template, port templates, silence-cut and transcription helpers, and `recipes.md` for reusable snippets.
- `blocks/` - drop-in compositions (cinematic hero, logo outro, world map, course tour). See `blocks/README.md`.
- `examples/` - paste-ready single-file references. See `examples/README.md`.
- `scripts/run-hyperframes.mjs` runs the pinned HyperFrames CLI with hidden Windows consoles; `scripts/prepare-video-folders.mjs` scaffolds a video project; `scripts/transcribe-assemblyai.py` transcribes with word timings.

## Where things live in this package

- `skills/animate/` is this skill. Copy it into your agent's skills folder.
- `library/index.html` is the RUBRIC Elements library. `node library/register-asset.mjs entry.json` adds an entry and rebuilds the page; `node library/build.mjs` rebuilds on its own. `library/motion-studio.html` holds the 14 motion recipes with copyable code.
- `assets/` holds the library's portable files. Put new element folders under `assets/components/<name>/` so the package stays portable.
- Keep one folder per video project; scaffold it with `node skills/animate/scripts/prepare-video-folders.mjs <folder>`.

## Refining this skill

Absorb approved outcomes into the template or reference that owns them instead of adding competing rules. Check changes against `references/evals.md`. Log significant decisions in the video masterclass project context. Run the skill-creator-plus validator and confirm linked paths resolve before packaging.
