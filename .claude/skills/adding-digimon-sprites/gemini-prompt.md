# Gemini prompts for DigiBonk sprites

One animation per image. Each image is a square grid, and every frame faces RIGHT (the cutter flips them all with `:flip`).
Gemini fails on big multi-row sheets: it mixes directions, ignores frame counts, and copies the reference frames.

Attach `assets-src/sprites/dw3/agumon.png` to the first prompt only, as a style reference. Run the rest in the same conversation.
Do not describe the Digimon: Gemini already knows it, and descriptions made results worse.

## Base prompt (side walk)

```
The attached image is ONLY a pixel-art style reference. Do not copy any of its frames
and do not draw Agumon or any other Digimon from it.

Draw {DIGIMON} (Digimon) in that same PlayStation-era pixel-art style.

Make a square image with a grid of 3 columns x 2 rows = exactly 6 frames,
read left to right, top to bottom: a smooth walk cycle, side view,
{DIGIMON} facing RIGHT in every frame. Legs and arms must clearly change in every frame.
{DIGIMON} is large and fills most of each cell, same size in every frame,
feet on the same baseline, centered in its cell.
One flat solid gray background (#808080) for the whole image.
No lines between cells, no borders, no text, no other characters.
Dark outline, no blur, no anti-aliasing.
Output as PNG.
```

## Other animations

For each one, start with "Same style and same {DIGIMON} as before." and replace the animation sentence:

- **Run:** `a run cycle, side view, facing RIGHT, wide strides and swinging arms.`
- **Front walk:** `a walk cycle, front view, walking toward the camera.`
- **Back walk:** `a walk cycle, back view, walking away from the camera.`
- **Hurt + death:** use a `3 columns x 3 rows = exactly 9 frames` grid. Frames 1–3 are getting hit (recoils backward); frames 4–9 are dying (falls, lies down, dissolves into data particles).

Priority: side walk first; it alone makes the form walk in game. The game falls back to it for every missing direction.

## Cutting a result

The grid is regular, so write the cell rectangles yourself instead of detecting them:

```
CELLS=sheet.cells INSET=4 FUZZ=6 tools/sprites/cut-gemini.sh ID sheet.png SCALE walk1:0:flip …
```

- `FUZZ=6` works for a flat PNG background. Use 18 for JPEG.
- Scale by stage, from about 300 px tall in the cell: Child 16%, Adult 25%, Perfect 30%, Ultimate 33%.

## Ask for a redo when

- frames face different ways;
- the frame count is wrong;
- lines, text, or another Digimon appear;
- the background is not one flat color.
