export type {
  SpriteInput,
  RenderedSprite,
  VisualGradeOptions,
  VisualGradeSummary,
  VisualGradeResult,
} from "./types.js";
export { renderSprite } from "./render.js";
export { normalizeSvgRoot } from "./svg-utils.js";
export { PixelGrid } from "./pixel-grid.js";
export type { Point, Region, Component } from "./pixel-grid.js";
export { rgbaEqual, rgbaKey, rgbaToHex, redmeanDistance, hexToRgba } from "./color.js";
export type { RGBA } from "./color.js";
export { gradeStructure } from "./structural-grader.js";
export { detectBanding } from "./detectors/banding.js";
export { detectJaggies } from "./detectors/jaggies.js";
export { detectDithering } from "./detectors/dithering.js";
export { detectOutlineConsistency } from "./detectors/outline-consistency.js";
export { detectColorCount } from "./detectors/color-count.js";
export type { ColorCountResult } from "./detectors/color-count.js";
export { detectDisconnectedFragments } from "./detectors/attachment.js";
export { detectEnclosedHoles } from "./detectors/enclosed-holes.js";
export { gradeSpritePattern, gradeRenderedSprite } from "./visual-grader.js";
export {
  expandLSystem,
  generateFoliageSvg,
  generateFoliagePreset,
  FOLIAGE_PRESETS,
} from "./foliage.js";
export type { LSystemSpec, FoliageResult } from "./foliage.js";
export { packSpriteSheet } from "./sprite-sheet.js";
export type { SpriteSheetFrame, SpriteSheetFrameMeta, SpriteSheetResult } from "./sprite-sheet.js";
export { loadVisualCraftRubricData } from "./data-loader.js";
export type {
  VisualCraftRubricData,
  VisualCraftRubricEntry,
  SourceCitation,
} from "./data-loader.js";
