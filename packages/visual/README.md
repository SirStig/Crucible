# canvasloop-visual

Track A of [CanvasLoop](https://github.com/SirStig/CanvasLoop): pixel-exact SVG
rendering plus deterministic craft grading for pixel-art sprites and tiles.

```sh
npm install canvasloop-visual
```

```ts
import { renderSprite, gradeSpritePattern } from "canvasloop-visual";

const rendered = renderSprite({ svg, gridWidth: 16, gridHeight: 16 });
rendered.png; // PNG-encoded Buffer, exactly 16x16

const result = gradeSpritePattern({ svg, gridWidth: 16, gridHeight: 16 });
result.status; // "pass" | "warn" | "fail"
```

Input is arbitrary SVG. The declared grid size becomes the render size at one
SVG unit per pixel, so it works whether the source is one `<rect>` per pixel or
paths and curves.

Tier 1 detectors cover banding, jaggies, dithering overuse, outline
inconsistency, too-many-similar-colors, unattached fragments, and unintended
holes. They prove a sprite is structurally clean. Whether it's actually good
art (light source, hue shifting, silhouette readability) is Tier 2, which hands
a named rubric item to a calling agent looking at the rendered image.

Also ships `generateFoliageSvg` for L-system plant generation and
`packSpriteSheet` for grid-aligned sheet assembly.

Requires Node 22.12 or newer. MIT licensed.
