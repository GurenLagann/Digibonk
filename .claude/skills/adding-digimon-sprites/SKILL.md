---
name: adding-digimon-sprites
description: Use when a Digimon sprite sheet must go into DigiBonk (Digimon World 3 rip, Gemini-generated sheet, V-pet), when the user sends a sheet image or asks for a Gemini sprite prompt, or when an in-game sprite faces the wrong way, slides without moving its legs, plays the wrong animation, or shows a back view when hit.
---

# Adding Digimon sprites

## Overview

A sheet becomes a horizontal strip in `public/sprites/<id>.png` plus roles in `manifest.json`. Every past failure came from **assuming** what a frame is (its direction, or whether it is idle/walk/run) instead of **checking**. Identify each frame with the tools below before writing any config.

## Roles the game reads

| Role | Meaning |
|---|---|
| `idle1`, `idleup`, `idledown`, `idlediagup`, `idlediagdown` | standing still, one fixed frame per direction |
| `walkN`, `walkupN`, `walkdownN`, `walkdiagupN`, `walkdiagdownN` | walk cycle, legs clearly moving (N ≤ 24) |
| `run…` (same suffixes) | run cycle; used when speed ≥ 2× the starting speed |
| `hurtN` / `deathN` | hit reaction / death (optional) |

Side and diagonal frames must face **LEFT**; the game mirrors them. `up` = back view, `down` = front view. Missing directions fall back to side frames. A sprite with no hurt pose keeps its movement frame when hit.

## Process

1. **Find the source.** Child forms: DW3 field sprites (`assets-src/sprites/dw3/`). Forms DW3 lacks: ask the user for a Gemini sheet; prompt templates in `gemini-prompt.md` (attach `assets-src/sprites/dw3/agumon.png` as the style reference).
2. **Map the frames.**
   ```bash
   node --experimental-strip-types tools/sprites/inspect.ts SHEET.png > grid.txt   # ids "row.col"
   bash tools/sprites/label.sh SHEET.png grid.txt labels.png                       # ids drawn in place
   bash tools/sprites/contact.sh SHEET.png grid.txt contact.png [row]              # frames side by side
   ```
   Read `labels.png` first (true positions). A sprite with no box around it was not detected: crop it by hand. Label every group as idle / walk / run / attack / hurt / death, plus its direction.
3. **Check the direction.** Zoom one side frame until the snout is unambiguous. Classify the other **side** frames against it:
   `node --experimental-strip-types tools/sprites/facing.ts SHEET.png grid.txt REF_ID ids…`
   Zoom every `inconclusivo` frame. For diagonal, front and back frames the silhouette test is unreliable: judge them by zoom.
4. **Build.**
   - DW3-style flat background: add an entry to `CONFIG` in `tools/sprites/build-dw3.ts`. Use `[row, firstCol]` for consecutive frames, or a list of ids (`['0.15', '0.16', '1.0']`) when they are scattered.
     - `walkFrames` / `runFrames` apply to every `[row, firstCol]` entry. An id list counts its own length.
     - `idle` takes exactly one frame per direction: `[row, col]` or `['3.0']`. With no separate idle group, use the first frame of each walk cycle.
     - Frames smaller than 10×15 px are never detected and cannot be referenced. Leave them out.
   - Gemini JPEG: run `tools/sprites/cut-gemini.sh` (`role:cell[:flip]`; `CELLS=file` for irregular sheets), then `npm run sprites:vpet`.
5. **Verify.** Render each role group of the built strip and look at it. Then run `npx vitest run`. In Chrome at `?debug`, read the frame index the game draws while holding each direction, using the "Velocidade 2×" button for run. Screenshots are only valid while the window is focused; an unfocused tab freezes the game.

## How each frame type looks

| Frame type | Telltale |
|---|---|
| Idle | near-identical frames, feet planted (DW3 walkers: usually the **first** row; not always) |
| Walk | short steps, feet change every frame |
| Run | wide stride, arms swinging, more frames |
| Different-facing frame mixed into a cycle | common in Gemini sheets; flip it or drop it |
| Labelled sheet (IDLE / WALK / RUN) | trust the labels |
| Flying Digimon (Patamon…) | no stride: use the wing/ear-flap cycle as walk and leave run out (the game falls back to walk) |

## Common mistakes

| Mistake | Fix |
|---|---|
| Flipping DW3 frames | DW3 already faces left |
| First DW3 row used as walk | that row is idle |
| Walk and run swapped | run = wider stride and swinging arms |
| One uniform grid on an irregular sheet | `inspect.ts` ids + `label.sh`; explicit id lists or `CELLS=` |
| Comparing silhouettes across different Digimon | `facing.ts` only works within one sheet |
| Crediting the names printed on Gemini sheets | those credits are invented; never copy them |
