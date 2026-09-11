import type { Finding } from "@canvasloop/core";
import type { PixelGrid } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";
import { rgbaKey, rgbaToHex } from "../color.js";

const DEFAULT_RATIO = 0.15;

/**
 * "Outline width/presence varies with no reason" — samples the sprite's
 * outer contour (opaque pixels adjacent to transparent), takes the single
 * most common contour color as the "dominant border color," and flags
 * when a large-enough fraction of the contour doesn't match it. This is a
 * presence/color-consistency check, not a full thickness profile: it
 * catches an outline that drops out or changes color partway around the
 * silhouette, which is the concrete complaint in the rubric ("varies with
 * no reason") — it does not attempt to measure outline thickness in
 * pixels, which would need normal-direction walking and is a documented
 * gap, not an oversight.
 */
export function detectOutlineConsistency(grid: PixelGrid, options: VisualGradeOptions = {}): Finding[] {
  const ratioThreshold = options.outlineInconsistencyRatio ?? DEFAULT_RATIO;
  const contour = grid.contourPixels();
  if (contour.length === 0) return [];

  const colorCounts = new Map<string, { count: number; hex: string }>();
  for (const point of contour) {
    const color = grid.colorAt(point.x, point.y);
    const key = rgbaKey(color);
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { count: 1, hex: rgbaToHex(color) });
    }
  }

  let dominantKey = "";
  let dominantCount = -1;
  for (const [key, { count }] of colorCounts) {
    if (count > dominantCount) {
      dominantKey = key;
      dominantCount = count;
    }
  }
  const dominantHex = colorCounts.get(dominantKey)!.hex;

  const deviations = contour.filter((point) => rgbaKey(grid.colorAt(point.x, point.y)) !== dominantKey);
  const mismatchRatio = deviations.length / contour.length;
  if (mismatchRatio < ratioThreshold) return [];

  const sample = deviations[0]!;
  return [
    {
      id: "visual.outline-consistency",
      ruleId: "outline-inconsistency",
      severity: mismatchRatio >= ratioThreshold * 2 ? "fail" : "warn",
      message: `${Math.round(mismatchRatio * 100)}% of the outline contour doesn't match the dominant border color (${dominantHex}) — the outline reads as dropping out or changing without an apparent reason.`,
      location: { x: sample.x, y: sample.y },
      data: {
        dominantColor: dominantHex,
        contourPixelCount: contour.length,
        deviatingPixelCount: deviations.length,
        ratio: Number(mismatchRatio.toFixed(3)),
      },
      fixHint: "Match the outline color/presence around the rest of the silhouette, or give the exception a deliberate reason (e.g. a highlight break).",
    },
  ];
}
