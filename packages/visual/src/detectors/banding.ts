import type { Finding, Severity } from "@canvasloop/core";
import type { PixelGrid, Region } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";
import type { RGBA } from "../color.js";
import { rgbaToHex } from "../color.js";

const DEFAULT_MIN_REGION_SIZE = 4;
const DEFAULT_ELONGATION_THRESHOLD = 3;
const MAX_HUE_DIFFERENCE_DEGREES = 30;
const MIN_LIGHTNESS_DIFFERENCE = 0.05;
// How much a shared border is allowed to wander (in pixels) and still count
// as "a straight line" rather than following the silhouette's curve.
const BORDER_LINEARITY_MAX_SPREAD = 1;

type Orientation = "horizontal" | "vertical";

interface RegionShape {
  region: Region;
  elongation: number;
  orientation: Orientation;
}

function rgbToHsl(c: RGBA): { h: number; l: number } {
  const r = c.r / 255;
  const g = c.g / 255;
  const b = c.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, l };

  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, l };
}

function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function shapeOf(region: Region): RegionShape {
  const width = region.maxX - region.minX + 1;
  const height = region.maxY - region.minY + 1;
  return {
    region,
    elongation: Math.max(width, height) / Math.min(width, height),
    orientation: width >= height ? "horizontal" : "vertical",
  };
}

/**
 * "Parallel same-value color bands along a contour" — flood-fills opaque
 * pixels into same-color regions, then flags pairs of elongated
 * (strip-like), similarly-oriented, same-hue-different-lightness regions
 * whose shared border is nearly a perfectly straight line. That's the
 * concrete, checkable version of "banding": a shading step that cuts a
 * straight edge instead of following the form. No ground-truth image
 * corpus exists to validate this against, so it's a documented heuristic
 * (see packages/visual/RESEARCH.md-equivalent reasoning in this file),
 * not proven computer vision.
 */
export function detectBanding(grid: PixelGrid, options: VisualGradeOptions = {}): Finding[] {
  const minRegionSize = options.minRegionSizeForBanding ?? DEFAULT_MIN_REGION_SIZE;
  const elongationThreshold = options.bandingElongationThreshold ?? DEFAULT_ELONGATION_THRESHOLD;

  const regions = grid.floodFillRegions().filter((region) => region.pixels.length >= minRegionSize);
  if (regions.length < 2) return [];

  const regionIndexAt = new Map<string, number>();
  regions.forEach((region, index) => {
    for (const p of region.pixels) regionIndexAt.set(`${p.x},${p.y}`, index);
  });

  const shapes = regions.map(shapeOf);
  const seenPairs = new Set<string>();
  const findings: Finding[] = [];

  for (let i = 0; i < regions.length; i++) {
    const shapeA = shapes[i]!;
    if (shapeA.elongation < elongationThreshold) continue;

    for (const pixel of shapeA.region.pixels) {
      const neighborCoords = [
        [pixel.x + 1, pixel.y],
        [pixel.x - 1, pixel.y],
        [pixel.x, pixel.y + 1],
        [pixel.x, pixel.y - 1],
      ] as const;

      for (const [nx, ny] of neighborCoords) {
        const j = regionIndexAt.get(`${nx},${ny}`);
        if (j === undefined || j === i) continue;
        const pairKey = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (seenPairs.has(pairKey)) continue;
        seenPairs.add(pairKey);

        const shapeB = shapes[j]!;
        if (shapeB.elongation < elongationThreshold) continue;
        if (shapeA.orientation !== shapeB.orientation) continue;

        const hslA = rgbToHsl(shapeA.region.color);
        const hslB = rgbToHsl(shapeB.region.color);
        if (hueDistance(hslA.h, hslB.h) > MAX_HUE_DIFFERENCE_DEGREES) continue;
        if (Math.abs(hslA.l - hslB.l) < MIN_LIGHTNESS_DIFFERENCE) continue;

        const coordAxis: "x" | "y" = shapeA.orientation === "horizontal" ? "y" : "x";
        const borderCoords: number[] = [];
        for (const pa of shapeA.region.pixels) {
          const adjacents = [
            [pa.x + 1, pa.y],
            [pa.x - 1, pa.y],
            [pa.x, pa.y + 1],
            [pa.x, pa.y - 1],
          ] as const;
          for (const [ax, ay] of adjacents) {
            if (regionIndexAt.get(`${ax},${ay}`) === j) {
              borderCoords.push(coordAxis === "y" ? pa.y : pa.x);
              break;
            }
          }
        }
        if (borderCoords.length === 0) continue;

        const spread = Math.max(...borderCoords) - Math.min(...borderCoords);
        if (spread > BORDER_LINEARITY_MAX_SPREAD) continue;

        const severity: Severity = spread === 0 ? "fail" : "warn";
        const hexA = rgbaToHex(shapeA.region.color);
        const hexB = rgbaToHex(shapeB.region.color);
        findings.push({
          id: "visual.banding",
          ruleId: "banding",
          severity,
          message: `Two elongated, similarly-colored regions (${hexA} and ${hexB}) share a nearly straight border — reads as a flat shading band rather than following the form.`,
          location: { x: shapeA.region.minX, y: shapeA.region.minY },
          data: { colors: [hexA, hexB], borderSpread: spread },
          fixHint: "Break the parallel run — vary the band's edge so it follows the silhouette instead of cutting a straight line.",
        });
      }
    }
  }

  return findings;
}
