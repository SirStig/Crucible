import type { Finding, Severity } from "canvasloop-core";
import type { DialogueLine, GradeOptions } from "../types.js";
import { splitSentences } from "../sentence-split.js";

const DEFAULT_MIN_SENTENCES = 4;
const DEFAULT_TARGET_CV = 0.35;
const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

export interface SentenceRhythmResult {
  findings: Finding[];
  sentenceCount: number;
  /** True when there weren't enough sentences pooled to judge rhythm at all. */
  skipped: boolean;
}

/**
 * Flags uniform sentence-length rhythm, where every sentence takes about
 * the same beat to read, a hallmark of machine-generated prose. Measured as
 * the coefficient of variation (stddev / mean) of word counts across every
 * sentence pooled from the input. Skipped outright below `minSentences`
 * (default 4) rather than drawing a conclusion from too little data.
 */
export function detectSentenceRhythm(
  lines: DialogueLine[],
  options: GradeOptions = {},
): SentenceRhythmResult {
  const minSentences = options.minSentencesForRhythm ?? DEFAULT_MIN_SENTENCES;
  const targetCv = options.targetCv ?? DEFAULT_TARGET_CV;

  const sentences = lines.flatMap((line) => splitSentences(line.text));
  if (sentences.length < minSentences) {
    return { findings: [], sentenceCount: sentences.length, skipped: true };
  }

  const wordCounts = sentences.map((sentence) => (sentence.match(WORD_PATTERN) ?? []).length);
  const mean = average(wordCounts);
  const variance = average(wordCounts.map((count) => (count - mean) ** 2));
  const coefficientOfVariation = mean === 0 ? 0 : Math.sqrt(variance) / mean;

  if (coefficientOfVariation >= targetCv) {
    return { findings: [], sentenceCount: sentences.length, skipped: false };
  }

  const severity: Severity = coefficientOfVariation < targetCv / 2 ? "fail" : "warn";
  const finding: Finding = {
    id: "prose.sentence-rhythm",
    ruleId: "uniform-sentence-rhythm",
    severity,
    message: `Sentence lengths barely vary across this document (coefficient of variation ${coefficientOfVariation.toFixed(2)}, target ≥ ${targetCv}). Every line takes about the same beat to read.`,
    data: {
      coefficientOfVariation: Number(coefficientOfVariation.toFixed(3)),
      sentenceCount: sentences.length,
      wordCounts,
    },
    fixHint:
      "Split one sentence and shorten another. Vary the beat instead of keeping every line the same length.",
  };

  return { findings: [finding], sentenceCount: sentences.length, skipped: false };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
