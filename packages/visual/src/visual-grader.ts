import type { Finding, GradeStatus } from "@canvasloop/core";
import type {
  RenderedSprite,
  SpriteInput,
  VisualGradeOptions,
  VisualGradeResult,
} from "./types.js";
import { renderSprite } from "./render.js";
import { PixelGrid } from "./pixel-grid.js";
import { gradeStructure } from "./structural-grader.js";
import { detectBanding } from "./detectors/banding.js";
import { detectJaggies } from "./detectors/jaggies.js";
import { detectDithering } from "./detectors/dithering.js";
import { detectOutlineConsistency } from "./detectors/outline-consistency.js";
import { detectColorCount } from "./detectors/color-count.js";
import { detectDisconnectedFragments } from "./detectors/attachment.js";
import { detectEnclosedHoles } from "./detectors/enclosed-holes.js";

/**
 * Grades an already-rendered sprite (no re-render) — the entry point tool
 * layers should use when they also need the PNG bytes for an image
 * response, since `renderSprite` only needs to run once. A fully
 * transparent canvas is a clean, informative fail ("nothing was drawn"),
 * not a crash — same discipline as `gradeProsePattern`'s empty-input case.
 */
export function gradeRenderedSprite(
  rendered: RenderedSprite,
  options: VisualGradeOptions = {},
): VisualGradeResult {
  const gradedAt = new Date().toISOString();
  const grid = new PixelGrid(rendered.width, rendered.height, rendered.pixels);
  const opaquePixelCount = grid.opaquePixelCount();

  if (opaquePixelCount === 0) {
    return {
      status: "fail",
      findings: [
        {
          id: "visual.structural",
          ruleId: "empty-canvas",
          severity: "fail",
          message: "Nothing was drawn — the rendered canvas has no opaque pixels.",
          fixHint: "Check that the SVG actually contains visible shapes within the declared grid.",
        },
      ],
      summary: {
        width: rendered.width,
        height: rendered.height,
        opaquePixelCount: 0,
        uniqueColorCount: 0,
        effectivePaletteSize: 0,
        empty: true,
      },
      gradedAt,
    };
  }

  const colorCount = detectColorCount(grid, options);
  const findings: Finding[] = [
    ...gradeStructure(grid),
    ...detectBanding(grid, options),
    ...detectJaggies(grid, options),
    ...detectDithering(grid, options),
    ...detectOutlineConsistency(grid, options),
    ...colorCount.findings,
    ...detectDisconnectedFragments(grid, options),
    ...detectEnclosedHoles(grid, options),
  ];

  return {
    status: overallStatus(findings),
    findings,
    summary: {
      width: rendered.width,
      height: rendered.height,
      opaquePixelCount,
      uniqueColorCount: colorCount.uniqueColorCount,
      effectivePaletteSize: colorCount.effectivePaletteSize,
      empty: false,
    },
    gradedAt,
  };
}

/** Convenience wrapper: renders then grades in one call. */
export function gradeSpritePattern(
  input: SpriteInput,
  options: VisualGradeOptions = {},
): VisualGradeResult {
  return gradeRenderedSprite(renderSprite(input), options);
}

function overallStatus(findings: readonly Finding[]): GradeStatus {
  if (findings.some((finding) => finding.severity === "fail")) return "fail";
  if (findings.some((finding) => finding.severity === "warn")) return "warn";
  return "pass";
}
