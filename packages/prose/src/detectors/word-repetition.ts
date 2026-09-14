import type { Finding, Severity } from "crucible-base";
import type { DialogueLine, GradeOptions } from "../types.js";
import { contentWords } from "../text-normalize.js";

const DEFAULT_MIN_LINES = 6;
const DEFAULT_MIN_OCCURRENCE_LINES = 4;
const DEFAULT_LINE_RATIO = 0.35;
// Escalation is a flat absolute-count threshold rather than a higher ratio
// cutoff, deliberately: a ratio-based fail threshold is unstable on small
// documents (the same instability that made the sentence-rhythm check's
// coefficient of variation unreliable at low sample sizes), so this uses
// the more robust "still true regardless of document length" signal.
const FAIL_OCCURRENCE_LINES = 6;

/**
 * Added from real dogfooding rather than external research:
 * flags a content word that recurs across many separate lines/messages in
 * the same document, e.g. a UI-string set where five different messages
 * each separately reassure the reader that "nothing has changed." A single
 * repeated word doesn't reliably show up as adjacent-line redundancy (the
 * only compares neighbors), but reads as a tic once it's the throughline of
 * a whole section. Counts distinct *lines* containing the word, not total
 * occurrences, so a word used twice in one long line doesn't count double.
 */
export function detectWordRepetition(lines: DialogueLine[], options: GradeOptions = {}): Finding[] {
  const minLines = options.minLinesForRepetition ?? DEFAULT_MIN_LINES;
  const minOccurrenceLines = options.minOccurrenceLines ?? DEFAULT_MIN_OCCURRENCE_LINES;
  const lineRatio = options.repetitionLineRatio ?? DEFAULT_LINE_RATIO;

  if (lines.length < minLines) return [];

  const lineNumbersByWord = new Map<string, number[]>();
  for (const line of lines) {
    const wordsInLine = new Set(contentWords(line.text));
    for (const word of wordsInLine) {
      const existing = lineNumbersByWord.get(word);
      if (existing) {
        existing.push(line.sourceLine);
      } else {
        lineNumbersByWord.set(word, [line.sourceLine]);
      }
    }
  }

  const findings: Finding[] = [];
  for (const [word, lineNumbers] of lineNumbersByWord) {
    const ratio = lineNumbers.length / lines.length;
    if (lineNumbers.length < minOccurrenceLines || ratio < lineRatio) continue;

    const severity: Severity = lineNumbers.length >= FAIL_OCCURRENCE_LINES ? "fail" : "warn";
    findings.push({
      id: "prose.word-repetition",
      ruleId: "repeated-word-overuse",
      severity,
      message: `"${word}" appears in ${lineNumbers.length} of ${lines.length} lines, reading as a tic rather than a deliberate refrain.`,
      location: { line: lineNumbers[0]! },
      data: { word, lineCount: lineNumbers.length, totalLines: lines.length, lines: lineNumbers },
      fixHint:
        "Cut most of the repeats. If the point is worth making once for emphasis, it doesn't need saying again in every other line.",
    });
  }

  return findings;
}
