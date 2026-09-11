import type { Finding, GradeStatus } from "@canvasloop/core";
import type { DialogueLine, GradeOptions, ProseGradeResult } from "./types.js";
import { detectAiTellPhrases } from "./detectors/ai-tell-phrases.js";
import { detectBalancedConstruction } from "./detectors/balanced-construction.js";
import { detectSentenceRhythm } from "./detectors/sentence-rhythm.js";
import { detectSaidBookisms } from "./detectors/said-bookism.js";
import { detectRedundantRestating } from "./detectors/redundant-restating.js";
import { detectWordRepetition } from "./detectors/word-repetition.js";

/**
 * FR14 + FR15, orchestrated: runs the full Tier 1 pattern grader (AI-tell
 * phrases, balanced-construction templates, sentence rhythm, said-bookisms,
 * adjacent-line redundancy) and rolls the results into one GradeResult.
 * Empty/all-blank input is a clean pass, not an error.
 */
export function gradeProsePattern(
  lines: DialogueLine[],
  options: GradeOptions = {},
): ProseGradeResult {
  const gradedAt = new Date().toISOString();

  if (lines.length === 0) {
    return {
      status: "pass",
      findings: [],
      summary: {
        lineCount: 0,
        sentenceCount: 0,
        rhythmSkipped: true,
        saidBookismApplicable: false,
        empty: true,
      },
      gradedAt,
    };
  }

  const rhythm = detectSentenceRhythm(lines, options);
  const bookisms = detectSaidBookisms(lines, options.bookismsFile);

  const findings: Finding[] = [
    ...detectAiTellPhrases(lines, options.phrasesFile),
    ...detectBalancedConstruction(lines, options.phrasesFile),
    ...rhythm.findings,
    ...bookisms.findings,
    ...detectRedundantRestating(lines, options),
    ...detectWordRepetition(lines, options),
  ];

  return {
    status: overallStatus(findings),
    findings,
    summary: {
      lineCount: lines.length,
      sentenceCount: rhythm.sentenceCount,
      rhythmSkipped: rhythm.skipped,
      saidBookismApplicable: bookisms.applicable,
      empty: false,
    },
    gradedAt,
  };
}

function overallStatus(findings: readonly Finding[]): GradeStatus {
  if (findings.some((finding) => finding.severity === "fail")) return "fail";
  if (findings.some((finding) => finding.severity === "warn")) return "warn";
  return "pass";
}
