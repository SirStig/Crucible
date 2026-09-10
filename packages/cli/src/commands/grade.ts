import { readFileSync } from "node:fs";
import type { GradeOptions } from "@canvasloop/prose";
import { parseDialogueFile, gradeProsePattern } from "@canvasloop/prose";
import { formatReport } from "../format-report.js";

export interface GradeCommandOptions {
  json?: boolean;
  minSentencesForRhythm?: number;
  targetCv?: number;
  minTokensForRedundancy?: number;
  redundancyThreshold?: number;
  phrasesFile?: string;
  bookismsFile?: string;
}

export interface GradeCommandResult {
  /** 0 on pass/warn, 1 on fail — usable directly as a process exit code for CI. */
  exitCode: number;
  output: string;
}

function toGradeOptions(options: GradeCommandOptions): GradeOptions {
  const gradeOptions: GradeOptions = {};
  if (options.minSentencesForRhythm !== undefined) {
    gradeOptions.minSentencesForRhythm = options.minSentencesForRhythm;
  }
  if (options.targetCv !== undefined) gradeOptions.targetCv = options.targetCv;
  if (options.minTokensForRedundancy !== undefined) {
    gradeOptions.minTokensForRedundancy = options.minTokensForRedundancy;
  }
  if (options.redundancyThreshold !== undefined) {
    gradeOptions.redundancyThreshold = options.redundancyThreshold;
  }
  if (options.phrasesFile !== undefined) gradeOptions.phrasesFile = options.phrasesFile;
  if (options.bookismsFile !== undefined) gradeOptions.bookismsFile = options.bookismsFile;
  return gradeOptions;
}

/**
 * Pure-ish action function: reads and grades a file, returning the rendered
 * output and an exit code rather than printing/exiting itself, so it's
 * directly testable without shelling out.
 */
export function runGradeCommand(
  filePath: string,
  options: GradeCommandOptions,
): GradeCommandResult {
  const text = readFileSync(filePath, "utf-8");
  const lines = parseDialogueFile(text);
  const result = gradeProsePattern(lines, toGradeOptions(options));
  const output = options.json ? JSON.stringify(result, null, 2) : formatReport(result, filePath);
  return { exitCode: result.status === "fail" ? 1 : 0, output };
}
