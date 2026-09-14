import type { Finding, Severity } from "crucible-base";
import type { PixelGrid } from "../pixel-grid.js";
import type { VisualGradeOptions } from "../types.js";

const DEFAULT_MIN_RUN = 4;
const DEFAULT_TREAD_CV = 0.35;
const FAIL_CV_MULTIPLIER = 2;
// A run needs at least this many tread-length samples before its CV means
// anything. Same small-sample-instability lesson as the prose rhythm
// check (a CV computed from one or two gaps is noise, not a verdict).
const MIN_TREADS_FOR_JUDGMENT = 3;

type EdgeName = "top" | "bottom" | "left" | "right";
const EDGES: readonly EdgeName[] = ["top", "bottom", "left", "right"];

interface DiagonalRun {
  startIndex: number;
  treadLengths: number[];
}

/** Per-column (top/bottom) or per-row (left/right) profile of the silhouette's edge position. */
function buildProfile(grid: PixelGrid, edge: EdgeName): (number | undefined)[] {
  const isColumnEdge = edge === "top" || edge === "bottom";
  const primaryLength = isColumnEdge ? grid.width : grid.height;
  const secondaryLength = isColumnEdge ? grid.height : grid.width;
  const scanForward = edge === "top" || edge === "left";

  const profile: (number | undefined)[] = [];
  for (let p = 0; p < primaryLength; p++) {
    let found: number | undefined;
    for (let s = 0; s < secondaryLength; s++) {
      const secondary = scanForward ? s : secondaryLength - 1 - s;
      const opaque = isColumnEdge ? grid.isOpaque(p, secondary) : grid.isOpaque(secondary, p);
      if (opaque) {
        found = secondary;
        break;
      }
    }
    profile.push(found);
  }
  return profile;
}

/**
 * Segments a profile into maximal monotonic-diagonal sub-runs (consistent
 * step direction, ignoring flat treads) and returns each run's sequence of
 * tread lengths (columns or rows between direction changes). A regular
 * staircase has near-equal treads; jaggies don't.
 */
function findDiagonalRuns(
  profile: ReadonlyArray<number | undefined>,
  minRunLength: number,
): DiagonalRun[] {
  const runs: DiagonalRun[] = [];
  let segStart = 0;

  while (segStart < profile.length) {
    if (profile[segStart] === undefined) {
      segStart++;
      continue;
    }
    let segEnd = segStart;
    while (segEnd + 1 < profile.length && profile[segEnd + 1] !== undefined) segEnd++;

    const stepPositions: number[] = [];
    const stepSigns: number[] = [];
    for (let x = segStart + 1; x <= segEnd; x++) {
      const delta = profile[x]! - profile[x - 1]!;
      if (delta !== 0) {
        stepPositions.push(x);
        stepSigns.push(delta > 0 ? 1 : -1);
      }
    }

    let subRunStart = 0;
    for (let k = 1; k <= stepSigns.length; k++) {
      const isFlip = k === stepSigns.length || stepSigns[k] !== stepSigns[subRunStart];
      if (!isFlip) continue;

      const positions = stepPositions.slice(subRunStart, k);
      if (positions.length >= MIN_TREADS_FOR_JUDGMENT + 1) {
        const treadLengths: number[] = [];
        for (let m = 1; m < positions.length; m++)
          treadLengths.push(positions[m]! - positions[m - 1]!);
        const runLength = positions[positions.length - 1]! - positions[0]!;
        if (runLength >= minRunLength) {
          runs.push({ startIndex: positions[0]!, treadLengths });
        }
      }
      subRunStart = k;
    }

    segStart = segEnd + 1;
  }

  return runs;
}

function coefficientOfVariation(values: number[]): number {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

/**
 * "Irregular pixel-step sequence on diagonals". Traces the silhouette's
 * top/bottom/left/right edge profiles, isolates each maximal diagonal run,
 * and flags a run whose tread-length coefficient of variation is too high
 * (an irregular staircase) rather than too low (which would be the
 * *opposite* problem, so this is deliberately the mirror image of the prose
 * rhythm check's threshold direction: there, uniform is the AI-tell;
 * here, uniform is the craft goal).
 */
export function detectJaggies(grid: PixelGrid, options: VisualGradeOptions = {}): Finding[] {
  const minRunLength = options.minDiagonalRunForJaggies ?? DEFAULT_MIN_RUN;
  const cvThreshold = options.jaggiesTreadCv ?? DEFAULT_TREAD_CV;

  const findings: Finding[] = [];

  for (const edge of EDGES) {
    const profile = buildProfile(grid, edge);
    const runs = findDiagonalRuns(profile, minRunLength);

    for (const run of runs) {
      const cv = coefficientOfVariation(run.treadLengths);
      if (cv < cvThreshold) continue;

      const severity: Severity = cv >= cvThreshold * FAIL_CV_MULTIPLIER ? "fail" : "warn";
      const isColumnEdge = edge === "top" || edge === "bottom";
      const location = isColumnEdge ? { x: run.startIndex } : { y: run.startIndex };

      findings.push({
        id: "visual.jaggies",
        ruleId: "jaggies",
        severity,
        message: `The ${edge} edge's diagonal step pattern is irregular (tread-length CV ${cv.toFixed(2)}, target < ${cvThreshold}), reading as jaggy rather than a clean staircase.`,
        location,
        data: {
          edge,
          treadLengths: run.treadLengths,
          coefficientOfVariation: Number(cv.toFixed(3)),
        },
        fixHint:
          "Regularize the step pattern: pick one over-and-up ratio for this diagonal and hold it.",
      });
    }
  }

  return findings;
}
