import type { Finding, Severity } from "crucible-base";
import type { PixelGrid } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";
import { rgbaEqual } from "../color.js";

const DEFAULT_MAX_TRANSITION_WIDTH = 3;
const FAIL_WIDTH_MULTIPLIER = 2;

interface DitherRegion {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  size: number;
}

/** A 2x2 window is "dithered" when its diagonals each hold one color and the two diagonals differ (a Bayer-style checkerboard cell). */
function collectDitheredPixels(grid: PixelGrid): Set<string> {
  const dithered = new Set<string>();
  for (let y = 0; y < grid.height - 1; y++) {
    for (let x = 0; x < grid.width - 1; x++) {
      const topLeft = grid.colorAt(x, y);
      const topRight = grid.colorAt(x + 1, y);
      const bottomLeft = grid.colorAt(x, y + 1);
      const bottomRight = grid.colorAt(x + 1, y + 1);
      if (topLeft.a === 0 || topRight.a === 0 || bottomLeft.a === 0 || bottomRight.a === 0)
        continue;

      const diagonalsMatch = rgbaEqual(topLeft, bottomRight) && rgbaEqual(topRight, bottomLeft);
      const colorsDiffer = !rgbaEqual(topLeft, topRight);
      if (diagonalsMatch && colorsDiffer) {
        dithered.add(`${x},${y}`);
        dithered.add(`${x + 1},${y}`);
        dithered.add(`${x},${y + 1}`);
        dithered.add(`${x + 1},${y + 1}`);
      }
    }
  }
  return dithered;
}

/** 4-connected flood fill over dithered-pixel membership (not color equality, since a dither cell alternates two colors). */
function floodFillDitherRegions(
  dithered: Set<string>,
  width: number,
  height: number,
): DitherRegion[] {
  const visited = new Set<string>();
  const regions: DitherRegion[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const startKey = `${x},${y}`;
      if (!dithered.has(startKey) || visited.has(startKey)) continue;

      const stack: [number, number][] = [[x, y]];
      visited.add(startKey);
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let size = 0;

      while (stack.length > 0) {
        const [cx, cy] = stack.pop()!;
        size++;
        minX = Math.min(minX, cx);
        maxX = Math.max(maxX, cx);
        minY = Math.min(minY, cy);
        maxY = Math.max(maxY, cy);

        const neighbors: [number, number][] = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
        ];
        for (const [nx, ny] of neighbors) {
          const key = `${nx},${ny}`;
          if (dithered.has(key) && !visited.has(key)) {
            visited.add(key);
            stack.push([nx, ny]);
          }
        }
      }

      regions.push({ minX, maxX, minY, maxY, size });
    }
  }

  return regions;
}

/**
 * "Dither covering a solid field instead of buffering a transition".
 * finds contiguous checkerboard-dithered regions and measures each one's
 * *narrow-dimension* width (the shorter of its bounding-box width/height,
 * a simple proxy for "thickness of the transition band" rather than a true
 * perpendicular-to-longest-axis measurement, a documented simplification,
 * not an oversight). A real transition dither is a thin band; anything
 * wider in both dimensions is filling an open area instead.
 */
export function detectDithering(grid: PixelGrid, options: VisualGradeOptions = {}): Finding[] {
  const maxTransitionWidth = options.ditherMaxTransitionWidth ?? DEFAULT_MAX_TRANSITION_WIDTH;

  const dithered = collectDitheredPixels(grid);
  if (dithered.size === 0) return [];

  const regions = floodFillDitherRegions(dithered, grid.width, grid.height);
  const findings: Finding[] = [];

  for (const region of regions) {
    const width = region.maxX - region.minX + 1;
    const height = region.maxY - region.minY + 1;
    const narrowWidth = Math.min(width, height);
    if (narrowWidth <= maxTransitionWidth) continue;

    const severity: Severity =
      narrowWidth >= maxTransitionWidth * FAIL_WIDTH_MULTIPLIER ? "fail" : "warn";
    findings.push({
      id: "visual.dithering",
      ruleId: "dithering-overuse",
      severity,
      message: `A dithered checkerboard region is ${narrowWidth}px thick in its narrow dimension (target ≤ ${maxTransitionWidth}px), reading as covering a solid field rather than buffering a transition.`,
      location: { x: region.minX, y: region.minY },
      data: { width, height, area: region.size },
      fixHint:
        "Commit to a flat color, or add an intermediate palette step, instead of dithering across an open area.",
    });
  }

  return findings;
}
