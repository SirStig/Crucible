import { Resvg } from "@resvg/resvg-js";
import type { RenderedSprite, SpriteInput } from "./types.js";
import { normalizeSvgRoot } from "./svg-utils.js";

/**
 * Renders a sprite to an exact-size RGBA pixel buffer via `@resvg/resvg-js`
 * (prebuilt native binaries, no system deps, which matters for staying
 * self-hostable). `shapeRendering: crispEdges` disables anti-aliasing on
 * shape edges, which is what makes "1 SVG unit = 1 pixel" actually hold:
 * without it, axis-aligned rects still blur at their boundaries and every
 * detector below (which reads exact per-pixel color) would be working
 * against noise instead of a clean grid.
 */
export function renderSprite(input: SpriteInput): RenderedSprite {
  if (!Number.isInteger(input.gridWidth) || input.gridWidth <= 0) {
    throw new RangeError("CanvasLoop: gridWidth must be a positive integer.");
  }
  if (!Number.isInteger(input.gridHeight) || input.gridHeight <= 0) {
    throw new RangeError("CanvasLoop: gridHeight must be a positive integer.");
  }

  const normalized = normalizeSvgRoot(input.svg, input.gridWidth, input.gridHeight);

  let resvg: Resvg;
  try {
    resvg = new Resvg(normalized, {
      fitTo: { mode: "original" },
      shapeRendering: 1,
    });
  } catch (error) {
    throw new Error(`CanvasLoop: could not parse SVG: ${(error as Error).message}`, {
      cause: error,
    });
  }

  const rendered = resvg.render();
  return {
    width: rendered.width,
    height: rendered.height,
    pixels: rendered.pixels,
    png: rendered.asPng(),
  };
}
