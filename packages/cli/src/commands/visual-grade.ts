import { readFileSync } from "node:fs";
import type { VisualGradeOptions } from "crucible-visual";
import { gradeSpritePattern } from "crucible-visual";
import { formatVisualReport } from "../format-visual-report.js";

export interface VisualGradeCommandOptions {
  gridWidth: number;
  gridHeight: number;
  json?: boolean;
  minRegionSizeForBanding?: number;
  bandingElongationThreshold?: number;
  minDiagonalRunForJaggies?: number;
  jaggiesTreadCv?: number;
  ditherMaxTransitionWidth?: number;
  outlineInconsistencyRatio?: number;
  colorClusterDistance?: number;
  colorCountRatio?: number;
  maxFragmentSizeRatio?: number;
  maxAttachmentGap?: number;
  maxUnintendedHoleSize?: number;
}

export interface VisualGradeCommandResult {
  /** 0 on pass or warn, 1 on fail. Usable directly as a process exit code for CI. */
  exitCode: number;
  output: string;
}

function toVisualGradeOptions(options: VisualGradeCommandOptions): VisualGradeOptions {
  const gradeOptions: VisualGradeOptions = {};
  if (options.minRegionSizeForBanding !== undefined) {
    gradeOptions.minRegionSizeForBanding = options.minRegionSizeForBanding;
  }
  if (options.bandingElongationThreshold !== undefined) {
    gradeOptions.bandingElongationThreshold = options.bandingElongationThreshold;
  }
  if (options.minDiagonalRunForJaggies !== undefined) {
    gradeOptions.minDiagonalRunForJaggies = options.minDiagonalRunForJaggies;
  }
  if (options.jaggiesTreadCv !== undefined) gradeOptions.jaggiesTreadCv = options.jaggiesTreadCv;
  if (options.ditherMaxTransitionWidth !== undefined) {
    gradeOptions.ditherMaxTransitionWidth = options.ditherMaxTransitionWidth;
  }
  if (options.outlineInconsistencyRatio !== undefined) {
    gradeOptions.outlineInconsistencyRatio = options.outlineInconsistencyRatio;
  }
  if (options.colorClusterDistance !== undefined) {
    gradeOptions.colorClusterDistance = options.colorClusterDistance;
  }
  if (options.colorCountRatio !== undefined) gradeOptions.colorCountRatio = options.colorCountRatio;
  if (options.maxFragmentSizeRatio !== undefined) {
    gradeOptions.maxFragmentSizeRatio = options.maxFragmentSizeRatio;
  }
  if (options.maxAttachmentGap !== undefined) {
    gradeOptions.maxAttachmentGap = options.maxAttachmentGap;
  }
  if (options.maxUnintendedHoleSize !== undefined) {
    gradeOptions.maxUnintendedHoleSize = options.maxUnintendedHoleSize;
  }
  return gradeOptions;
}

/** Pure-ish action function: reads, renders, and grades a sprite file, returning rendered output and an exit code. */
export function runVisualGradeCommand(
  filePath: string,
  options: VisualGradeCommandOptions,
): VisualGradeCommandResult {
  const svg = readFileSync(filePath, "utf-8");
  const result = gradeSpritePattern(
    { svg, gridWidth: options.gridWidth, gridHeight: options.gridHeight },
    toVisualGradeOptions(options),
  );
  const output = options.json
    ? JSON.stringify(result, null, 2)
    : formatVisualReport(result, filePath);
  return { exitCode: result.status === "fail" ? 1 : 0, output };
}
