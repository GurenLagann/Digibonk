# Gemini prompts for DigiBonk sprites

Attach `assets-src/sprites/dw3/agumon.png` (or the previous form's finished sheet) as the reference image.
For the next forms, continue in the same Gemini conversation.

## Template

```
Use the attached Digimon World 3 sprite sheet as the exact style and layout reference.
Create the same kind of sheet for {DIGIMON} (Digimon).

LAYOUT: rows of frames, evenly spaced, on ONE flat solid gray background (#808080).
No grid lines, no text, no labels, no credits, no other characters, no effects touching the character.
Row 1 — idle: 5 directions x 1 frame: back, back three-quarter, side, front three-quarter, front.
Row 2 — walk: the same 5 directions x 6 frames each, legs and arms clearly changing every frame.
Row 3 — run: the same 5 directions x 6 frames each, wide strides and swinging arms.
Row 4 — hurt (3 frames, side view) then death (6 frames, side view: falls, lies down, fades into data).
ALL side and three-quarter views face LEFT. Never mix directions inside a row.

STYLE: PlayStation-era pixel art exactly like the reference: same pixel size, dark outline,
same shading, no blur, no anti-aliasing. {SIZE_LINE}

{DIGIMON} looks like: {DESCRIPTION}. {NOT_LIKE}

Output as PNG.
```

## Fill-ins

- `{SIZE_LINE}`, by stage:
  - Child: "Same size as the reference."
  - Adult: "About 1.5x taller than the reference."
  - Perfect: "About 1.8x taller."
  - Ultimate: "About 2x taller."
- `{NOT_LIKE}`: what the previous form had that this one must NOT have, e.g. "No helmet and no horns" for Agumon after Greymon.

## Ask for a redo when

- a frame faces right;
- text, grid lines or another Digimon appear;
- the background is not one flat color.
