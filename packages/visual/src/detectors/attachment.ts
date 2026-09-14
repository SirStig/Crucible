import type { Finding, Severity } from "@canvasloop/core";
import type { PixelGrid, Component } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";

const DEFAULT_MAX_FRAGMENT_SIZE_RATIO = 0.15;
const DEFAULT_MAX_ATTACHMENT_GAP = 4;
// 2 is the smallest gap two genuinely separate (8-connectivity) components
// can have: a single row or column of background between them. That's almost
// always a rendering slip (a limb or handle meant to touch but off by one)
// rather than an intentional detached effect.
const HIGH_CONFIDENCE_GAP = 2;

/** Cheap Chebyshev gap between two components' bounding boxes. An approximation of nearest-pixel distance, not exact geometry (see this file's own doc comment). */
function bboxGap(a: Component, b: Component): number {
  const gapX = Math.max(0, b.minX - a.maxX, a.minX - b.maxX);
  const gapY = Math.max(0, b.minY - a.maxY, a.minY - b.maxY);
  return Math.max(gapX, gapY);
}

/**
 * "Attachment" check: a color-agnostic (8-connectivity) flood fill finds
 * every physically-touching blob of opaque pixels. A sprite meant to read
 * as one object should usually be one blob. A small, separate blob sitting
 * close to the main body is the concrete signature of a broken attachment
 * (a limb, handle, or accessory drawn with a gap instead of actually
 * touching what it's meant to connect to). Distance is a cheap
 * bounding-box-gap approximation, not exact nearest-pixel geometry, a
 * documented heuristic, not proven computer vision (same honesty standard
 * as the other detectors).
 *
 * Deliberately conservative: a fragment far from the main body, or large
 * relative to it, isn't flagged. Sprites legitimately have separate
 * effects/decorations (a spark, a detached leaf) and this check has no way
 * to distinguish those from a genuine attachment bug except proximity and
 * relative size.
 */
export function detectDisconnectedFragments(
  grid: PixelGrid,
  options: VisualGradeOptions = {},
): Finding[] {
  const maxFragmentSizeRatio = options.maxFragmentSizeRatio ?? DEFAULT_MAX_FRAGMENT_SIZE_RATIO;
  const maxAttachmentGap = options.maxAttachmentGap ?? DEFAULT_MAX_ATTACHMENT_GAP;

  const components = grid.connectedComponents();
  if (components.length < 2) return [];

  const sorted = [...components].sort((a, b) => b.pixels.length - a.pixels.length);
  const main = sorted[0]!;
  const findings: Finding[] = [];

  for (const fragment of sorted.slice(1)) {
    const sizeRatio = fragment.pixels.length / main.pixels.length;
    if (sizeRatio > maxFragmentSizeRatio) continue;

    const gap = bboxGap(fragment, main);
    if (gap > maxAttachmentGap) continue;

    const severity: Severity = gap <= HIGH_CONFIDENCE_GAP ? "fail" : "warn";
    findings.push({
      id: "visual.attachment",
      ruleId: "unattached-fragment",
      severity,
      message: `A ${fragment.pixels.length}px fragment sits only ~${gap}px from the main body (${main.pixels.length}px) without touching it, which is likely a broken attachment rather than an intentional separate piece.`,
      location: { x: fragment.minX, y: fragment.minY },
      data: { fragmentPixelCount: fragment.pixels.length, mainPixelCount: main.pixels.length, gap },
      fixHint:
        "Either connect this piece to the body it's meant to attach to (close the gap so they're touching), or, if it's meant to be separate, confirm that's intentional.",
    });
  }

  return findings;
}
