import type { Finding } from "crucible-base";
import type { PixelGrid } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";

const DEFAULT_MAX_UNINTENDED_HOLE_SIZE = 3;

/**
 * "Shape" check: finds transparent pixels fully enclosed by opaque ones
 * (unreachable from the canvas border by a 4-connected transparent flood
 * fill). A small enclosed hole, one or a few stray pixels sealed inside a
 * silhouette, is almost always an accidental gap in a fill rather than a
 * deliberate design (a window, a ring's center) would normally be sized on
 * purpose and read as intentional. Above `maxUnintendedHoleSize` this stops
 * flagging by default, since a larger enclosed region is ambiguous enough
 * that guessing "bug" would be as likely to be wrong as right, a
 * documented limitation rather than proven computer vision.
 */
export function detectEnclosedHoles(grid: PixelGrid, options: VisualGradeOptions = {}): Finding[] {
  const maxUnintendedHoleSize = options.maxUnintendedHoleSize ?? DEFAULT_MAX_UNINTENDED_HOLE_SIZE;

  const holes = grid.enclosedTransparentRegions();
  const findings: Finding[] = [];

  for (const hole of holes) {
    if (hole.pixels.length > maxUnintendedHoleSize) continue;

    findings.push({
      id: "visual.shape",
      ruleId: "unintended-hole",
      severity: "warn",
      message: `A ${hole.pixels.length}px transparent gap is fully sealed inside the silhouette, which is likely an accidental hole in the fill rather than a deliberate opening.`,
      location: { x: hole.minX, y: hole.minY },
      data: { holePixelCount: hole.pixels.length },
      fixHint: "Fill the gap, or confirm it's a deliberate opening (a window, a ring's center).",
    });
  }

  return findings;
}
