import type { GradeResult } from "crucible-base";

/**
 * One parsed line of input. `raw` is preserved verbatim for export; `text` is
 * the speaker-prefix-stripped content that actually gets graded.
 */
export interface DialogueLine {
  /** 1-based line number in the original input file/string, including blank lines. */
  sourceLine: number;
  /** The line exactly as it appeared in the input. */
  raw: string;
  /** Parsed speaker name, when the line matched the "Speaker: text" convention. */
  speaker?: string;
  /** The line's content with any speaker prefix stripped. */
  text: string;
}

// Fields explicitly include `| undefined` (rather than just being optional)
// so a caller can pass through an object built from parsed/validated input
// (e.g. a zod-inferred `.optional()` shape from the MCP tools) without
// TypeScript's `exactOptionalPropertyTypes` rejecting an explicit
// `undefined` value on an otherwise-optional field.
export interface GradeOptions {
  /** Sentences must be pooled at least this many before the rhythm check runs at all. Default 4. */
  minSentencesForRhythm?: number | undefined;
  /** Coefficient-of-variation floor below which sentence rhythm reads as uniform. Default 0.35. */
  targetCv?: number | undefined;
  /** Lines with fewer content tokens than this are skipped by the redundancy check. Default 3. */
  minTokensForRedundancy?: number | undefined;
  /** Jaccard similarity at/above which adjacent lines are flagged as redundant. Default 0.6. */
  redundancyThreshold?: number | undefined;
  /** Path to a replacement ai-tell-phrases.json, overriding the bundled living-data file. */
  phrasesFile?: string | undefined;
  /** Path to a replacement said-bookisms.json, overriding the bundled living-data file. */
  bookismsFile?: string | undefined;
  /** Document must have at least this many non-blank lines before the word-repetition check runs. Default 6. */
  minLinesForRepetition?: number | undefined;
  /** A content word must appear in at least this many distinct lines to be flagged. Default 4. */
  minOccurrenceLines?: number | undefined;
  /** A content word must appear in at least this fraction of lines to be flagged. Default 0.35. */
  repetitionLineRatio?: number | undefined;
  /** Path to a project's own style-profile file. No bundled default; see style-profile.ts. */
  styleProfilesFile?: string | undefined;
  /** Which profile in `styleProfilesFile` to grade against. Falls back to that file's `defaultProfile` if omitted. */
  styleProfileId?: string | undefined;
}

export interface ProseGradeSummary {
  /** Non-blank lines that were actually graded. */
  lineCount: number;
  /** Sentences pooled across the document for the rhythm check. */
  sentenceCount: number;
  /** True when the rhythm check was skipped for having too few sentences to judge. */
  rhythmSkipped: boolean;
  /** True when the input contained at least one quoted span for the said-bookism check to examine. */
  saidBookismApplicable: boolean;
  /** True when the input was empty or entirely blank. */
  empty: boolean;
  /** The style-profile id actually applied, or null when no profile was supplied or resolved. */
  styleProfileApplied: string | null;
  // Index signature so a ProseGradeSummary value can flow through code that
  // is typed against GradeResult's default `Record<string, unknown>`
  // summary (e.g. LoopController.record) without a manual cast.
  [key: string]: unknown;
}

export type ProseGradeResult = GradeResult<ProseGradeSummary>;
