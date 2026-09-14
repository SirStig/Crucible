import type { Finding } from "@canvasloop/core";
import type { PixelGrid } from "./pixel-grid.js";

const DEFAULT_PARTIAL_ALPHA_WARN_RATIO = 0.1;
const DEFAULT_PARTIAL_ALPHA_FAIL_RATIO = 0.3;

/**
 * Cheap, always-first sanity checks: the visual equivalent of Track B's
 * pattern-grader running before anything judgment-heavy. Assumes the
 * caller has already handled the fully-empty-canvas case (see
 * visual-grader.ts): everything here is about a *non-empty* render that
 * might still have structural problems.
 */
export function gradeStructure(grid: PixelGrid): Finding[] {
  const findings: Finding[] = [];

  const edgeTouchingPixels: { x: number; y: number }[] = [];
  let opaqueCount = 0;
  let partialAlphaCount = 0;

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      const alpha = grid.alphaAt(x, y);
      if (alpha === 0) continue;
      opaqueCount++;
      if (alpha < 255) partialAlphaCount++;
      if (x === 0 || y === 0 || x === grid.width - 1 || y === grid.height - 1) {
        edgeTouchingPixels.push({ x, y });
      }
    }
  }

  if (edgeTouchingPixels.length > 0) {
    const first = edgeTouchingPixels[0]!;
    findings.push({
      id: "visual.structural",
      ruleId: "content-touches-canvas-edge",
      severity: "warn",
      message: `${edgeTouchingPixels.length} pixel(s) touch the canvas edge. Verify content wasn't clipped rather than intentionally bleeding to the border (e.g. a seamless tile).`,
      location: { x: first.x, y: first.y },
      data: { count: edgeTouchingPixels.length },
      fixHint:
        "If this wasn't meant to bleed to the edge, check the source SVG for content placed outside the declared grid.",
    });
  }

  if (opaqueCount > 0) {
    const partialRatio = partialAlphaCount / opaqueCount;
    if (partialRatio >= DEFAULT_PARTIAL_ALPHA_WARN_RATIO) {
      findings.push({
        id: "visual.structural",
        ruleId: "partial-alpha-noise",
        severity: partialRatio >= DEFAULT_PARTIAL_ALPHA_FAIL_RATIO ? "fail" : "warn",
        message: `${Math.round(partialRatio * 100)}% of drawn pixels have partial transparency (alpha between 1 and 254). Verify this is intentional (a glow, shadow, or soft edge) rather than accidental overlap or anti-aliasing.`,
        data: { partialAlphaCount, opaqueCount, ratio: Number(partialRatio.toFixed(3)) },
        fixHint:
          "Pixel art is usually either fully opaque or fully transparent per pixel; if this wasn't deliberate, flatten overlapping shapes or disable fill-opacity/gradients.",
      });
    }
  }

  return findings;
}
