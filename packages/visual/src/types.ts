import type { GradeResult } from "crucible-base";

/**
 * What the agent authors: arbitrary SVG markup plus a declared pixel grid.
 * The grid becomes the render width and height (1 SVG unit = 1 pixel), so it
 * doesn't matter whether the SVG is one `<rect>` per pixel or paths/curves
 * (the foliage generator needs the latter); every detector analyzes the
 * *rasterized* pixel buffer, never the SVG source.
 */
export interface SpriteInput {
  svg: string;
  gridWidth: number;
  gridHeight: number;
}

export interface RenderedSprite {
  width: number;
  height: number;
  /** Raw RGBA8, row-major, straight (non-premultiplied) alpha, 4 bytes per pixel. */
  pixels: Buffer;
  /** The same image, PNG-encoded, for export/preview. */
  png: Buffer;
}

// Fields explicitly include `| undefined` for the same exactOptionalPropertyTypes
// reason as crucible-prose's GradeOptions; see that file's comment.
export interface VisualGradeOptions {
  /** Same-color regions smaller than this (px) are ignored by the banding check. Default 4. */
  minRegionSizeForBanding?: number | undefined;
  /** Bounding-box aspect ratio (long/short side) a region must clear to count as "strip-like." Default 3. */
  bandingElongationThreshold?: number | undefined;
  /** A diagonal run shorter than this (columns) isn't judged for jaggies. Default 4. */
  minDiagonalRunForJaggies?: number | undefined;
  /** Coefficient-of-variation floor for tread lengths within a diagonal run. Default 0.35. */
  jaggiesTreadCv?: number | undefined;
  /** A dither region's narrow-dimension width (px) above this reads as "covering a field." Default 3. */
  ditherMaxTransitionWidth?: number | undefined;
  /** Fraction of the contour allowed to deviate from the dominant border color. Default 0.15. */
  outlineInconsistencyRatio?: number | undefined;
  /** Redmean perceptual distance below which two colors merge into one cluster. Default 24. */
  colorClusterDistance?: number | undefined;
  /** unique/effective palette-size ratio above which "too many similar colors" fires. Default 1.5. */
  colorCountRatio?: number | undefined;
  /** A stray component smaller than this fraction of the main body's pixel count is a candidate "unattached fragment." Default 0.15. */
  maxFragmentSizeRatio?: number | undefined;
  /** A stray component farther than this (Chebyshev distance, px) from the main body isn't flagged, since it is likely an intentional separate effect or decoration. Default 4. */
  maxAttachmentGap?: number | undefined;
  /** An enclosed transparent region larger than this (px) isn't flagged, since it is likely an intentional feature (a window) rather than a stray gap. Default 3. */
  maxUnintendedHoleSize?: number | undefined;
}

export interface VisualGradeSummary {
  width: number;
  height: number;
  opaquePixelCount: number;
  uniqueColorCount: number;
  effectivePaletteSize: number;
  /** True when the canvas had no opaque pixels at all: a clean fail, not a crash. */
  empty: boolean;
  // Index signature so this flows through GradeResult's default
  // Record<string, unknown> summary type, same reason as ProseGradeSummary.
  [key: string]: unknown;
}

export type VisualGradeResult = GradeResult<VisualGradeSummary>;
