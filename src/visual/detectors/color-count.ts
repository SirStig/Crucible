import type { Finding, Severity } from "../../base/index.js";
import type { PixelGrid } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";
import type { RGBA } from "../color.js";
import { redmeanDistance, rgbaToHex } from "../color.js";

const DEFAULT_CLUSTER_DISTANCE = 24;
const DEFAULT_RATIO = 1.5;
const FAIL_RATIO_MULTIPLIER = 1.5;

interface ColorCluster {
  representative: RGBA;
  members: RGBA[];
}

/**
 * Sequential "leader" clustering (also called canopy clustering): walk the
 * colors in order, join a color to the first existing cluster whose leader
 * is within `distanceThreshold`, otherwise start a new cluster with it as
 * leader. Simpler and fully deterministic compared to iterative
 * agglomerative merging, at the cost of being order-sensitive, a
 * documented tradeoff, not an attempt at optimal clustering.
 */
function clusterColors(colors: RGBA[], distanceThreshold: number): ColorCluster[] {
  const clusters: ColorCluster[] = [];
  for (const color of colors) {
    const match = clusters.find(
      (cluster) => redmeanDistance(color, cluster.representative) < distanceThreshold,
    );
    if (match) {
      match.members.push(color);
    } else {
      clusters.push({ representative: color, members: [color] });
    }
  }
  return clusters;
}

export interface ColorCountResult {
  findings: Finding[];
  uniqueColorCount: number;
  effectivePaletteSize: number;
}

/**
 * "Unique colors exceed the effective palette". Clusters opaque colors by
 * perceptual (redmean) distance; when the raw unique-color count is well
 * above the cluster count, several colors are reading as the same shade
 * and could be collapsed without losing visible variety.
 */
export function detectColorCount(
  grid: PixelGrid,
  options: VisualGradeOptions = {},
): ColorCountResult {
  const distanceThreshold = options.colorClusterDistance ?? DEFAULT_CLUSTER_DISTANCE;
  const ratioThreshold = options.colorCountRatio ?? DEFAULT_RATIO;

  const colors = grid.uniqueColors();
  const clusters = clusterColors(colors, distanceThreshold);
  const uniqueColorCount = colors.length;
  const effectivePaletteSize = clusters.length;

  const findings: Finding[] = [];
  if (effectivePaletteSize > 0 && uniqueColorCount / effectivePaletteSize >= ratioThreshold) {
    const ratio = uniqueColorCount / effectivePaletteSize;
    const severity: Severity = ratio >= ratioThreshold * FAIL_RATIO_MULTIPLIER ? "fail" : "warn";
    const mergedGroups = clusters
      .filter((cluster) => cluster.members.length > 1)
      .map((cluster) => cluster.members.map(rgbaToHex));

    findings.push({
      id: "visual.color-count",
      ruleId: "too-many-similar-colors",
      severity,
      message: `${uniqueColorCount} unique colors cluster into only ${effectivePaletteSize} perceptually distinct group(s), so several read as near-duplicates.`,
      data: { uniqueColorCount, effectivePaletteSize, mergedGroups },
      fixHint:
        "Collapse each group of near-identical colors down to one. The extras aren't adding visible palette variety.",
    });
  }

  return { findings, uniqueColorCount, effectivePaletteSize };
}
