import type { Finding, GradeStatus } from "@canvasloop/core";
import type { DialogueLine, GradeOptions, ProseGradeResult } from "./types.js";
import { detectAiTellPhrases } from "./detectors/ai-tell-phrases.js";
import { detectBalancedConstruction } from "./detectors/balanced-construction.js";
import { detectSentenceRhythm } from "./detectors/sentence-rhythm.js";
import { detectSaidBookisms } from "./detectors/said-bookism.js";
import { detectRedundantRestating } from "./detectors/redundant-restating.js";
import { detectWordRepetition } from "./detectors/word-repetition.js";
import { detectVoiceVocabulary } from "./detectors/voice-vocabulary.js";
import { resolveStyleProfile, applyStyleProfileToOptions } from "./style-profile.js";

/**
 * FR14 + FR15 + FR18, orchestrated: runs the full Tier 1 pattern grader
 * (AI-tell phrases, balanced-construction templates, sentence rhythm,
 * said-bookisms, adjacent-line redundancy, word-repetition-overuse) and,
 * when a style profile is supplied, layers on voice-vocabulary checking and
 * profile-specific rhythm targets. Rolls everything into one GradeResult.
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
        styleProfileApplied: null,
      },
      gradedAt,
    };
  }

  let resolvedOptions = options;
  let styleProfile: ReturnType<typeof resolveStyleProfile>;

  if (options.styleProfilesFile !== undefined) {
    styleProfile = resolveStyleProfile(options.styleProfilesFile, options.styleProfileId);
    if (!styleProfile) {
      const label =
        options.styleProfileId ?? "(no styleProfileId given, and the file sets no defaultProfile)";
      throw new Error(
        `CanvasLoop: could not resolve style profile "${label}" from ${options.styleProfilesFile}.`,
      );
    }
    resolvedOptions = applyStyleProfileToOptions(options, styleProfile);
  }

  const styleProfileApplied = styleProfile?.id ?? null;

  const rhythm = detectSentenceRhythm(lines, resolvedOptions);
  const bookisms = detectSaidBookisms(lines, resolvedOptions.bookismsFile);

  const findings: Finding[] = [
    ...detectAiTellPhrases(lines, resolvedOptions.phrasesFile),
    ...detectBalancedConstruction(lines, resolvedOptions.phrasesFile),
    ...rhythm.findings,
    ...bookisms.findings,
    ...detectRedundantRestating(lines, resolvedOptions),
    ...detectWordRepetition(lines, resolvedOptions),
    ...detectVoiceVocabulary(lines, styleProfile),
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
      styleProfileApplied,
    },
    gradedAt,
  };
}

function overallStatus(findings: readonly Finding[]): GradeStatus {
  if (findings.some((finding) => finding.severity === "fail")) return "fail";
  if (findings.some((finding) => finding.severity === "warn")) return "warn";
  return "pass";
}
