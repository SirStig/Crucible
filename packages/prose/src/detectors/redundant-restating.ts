import type { Finding, Severity } from "@canvasloop/core";
import type { DialogueLine, GradeOptions } from "../types.js";
import { contentTokens } from "../text-normalize.js";

const DEFAULT_MIN_TOKENS = 3;
const DEFAULT_THRESHOLD = 0.6;
const FAIL_THRESHOLD = 0.85;

/**
 * FR15: flags a line that restates the immediately preceding line in
 * different words. Similarity is measured with Jaccard overlap on
 * stopword-filtered, lightly stemmed content-token sets — a deliberate
 * local, model-call-free proxy for "semantic similarity" (Tier 1 has to
 * stay free per the NFRs; true embeddings would need a model call). Lines
 * with too few content tokens on either side are skipped, so short
 * exchanges like "Yes." / "No." never false-positive on shared function
 * words alone.
 */
export function detectRedundantRestating(lines: DialogueLine[], options: GradeOptions = {}): Finding[] {
  const minTokens = options.minTokensForRedundancy ?? DEFAULT_MIN_TOKENS;
  const threshold = options.redundancyThreshold ?? DEFAULT_THRESHOLD;
  const findings: Finding[] = [];

  for (let i = 1; i < lines.length; i++) {
    const previous = lines[i - 1]!;
    const current = lines[i]!;
    const previousTokens = new Set(contentTokens(previous.text));
    const currentTokens = new Set(contentTokens(current.text));

    if (previousTokens.size < minTokens || currentTokens.size < minTokens) continue;

    const similarity = jaccardSimilarity(previousTokens, currentTokens);
    if (similarity < threshold) continue;

    const severity: Severity = similarity >= FAIL_THRESHOLD ? "fail" : "warn";
    findings.push({
      id: "prose.redundant-restating",
      ruleId: "adjacent-line-redundancy",
      severity,
      message: `Line ${current.sourceLine} restates line ${previous.sourceLine} in different words (${Math.round(similarity * 100)}% token overlap).`,
      location: { line: current.sourceLine, excerpt: current.text },
      data: {
        previousLine: previous.sourceLine,
        similarity: Number(similarity.toFixed(3)),
        previousText: previous.text,
        currentText: current.text,
      },
      fixHint: "Cut one of the two — they're saying the same thing.",
    });
  }

  return findings;
}

function jaccardSimilarity(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let intersectionSize = 0;
  for (const token of a) {
    if (b.has(token)) intersectionSize++;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}
