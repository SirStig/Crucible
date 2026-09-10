import type { Finding } from "@canvasloop/core";
import type { DialogueLine } from "../types.js";
import type { BookismEntry } from "../data-loader.js";
import { loadSaidBookismData } from "../data-loader.js";
import { normalizeQuotes, excerpt } from "../text-normalize.js";

const CONTEXT_WORDS = 6;
const QUOTE_PATTERN = /"([^"]*)"/g;
const WORD_PATTERN = /[A-Za-z']+/g;

export interface SaidBookismResult {
  findings: Finding[];
  /** False when the input had no quoted spans at all — the check is then a documented no-op, not an error. */
  applicable: boolean;
}

/**
 * FR14d: flags said-bookisms — dialogue tags like "exclaimed" or "asserted"
 * standing in for a plain "said"/"asked" or an action beat. Looks at up to
 * `CONTEXT_WORDS` words immediately before and after each quoted span on a
 * line for a verb form listed in the living said-bookisms.json data.
 */
export function detectSaidBookisms(lines: DialogueLine[], bookismsFile?: string): SaidBookismResult {
  const data = loadSaidBookismData(bookismsFile);
  const verbToEntry = new Map<string, BookismEntry>();
  for (const entry of data.banned) {
    for (const form of entry.forms) {
      verbToEntry.set(form.toLowerCase(), entry);
    }
  }

  const findings: Finding[] = [];
  let sawAnyQuote = false;

  for (const line of lines) {
    const normalized = normalizeQuotes(line.text);
    QUOTE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = QUOTE_PATTERN.exec(normalized)) !== null) {
      sawAnyQuote = true;
      const quoteStart = match.index;
      const quoteEnd = match.index + match[0].length;

      const before = extractContextWords(normalized.slice(0, quoteStart), "trailing");
      const after = extractContextWords(normalized.slice(quoteEnd), "leading");
      const hit = findBannedVerb(before, verbToEntry) ?? findBannedVerb(after, verbToEntry);

      if (hit) {
        findings.push({
          id: "prose.said-bookism",
          ruleId: hit.entry.id,
          severity: hit.entry.severity,
          message: hit.entry.note
            ? `"${hit.word}" as a dialogue tag reads as a said-bookism (${hit.entry.note}).`
            : `"${hit.word}" as a dialogue tag reads as a said-bookism.`,
          location: {
            line: line.sourceLine,
            excerpt: excerpt(normalized, quoteStart, quoteEnd - quoteStart),
          },
          data: { matchedVerb: hit.word },
          fixHint: 'Replace with "said" (or drop the tag entirely) or cut to an action beat.',
        });
      }

      if (match[0].length === 0) QUOTE_PATTERN.lastIndex += 1;
    }
  }

  return { findings, applicable: sawAnyQuote };
}

function extractContextWords(segment: string, side: "leading" | "trailing"): string[] {
  const words = segment.match(WORD_PATTERN) ?? [];
  return side === "trailing" ? words.slice(-CONTEXT_WORDS) : words.slice(0, CONTEXT_WORDS);
}

function findBannedVerb(
  words: string[],
  verbToEntry: Map<string, BookismEntry>,
): { word: string; entry: BookismEntry } | undefined {
  for (const word of words) {
    const entry = verbToEntry.get(word.toLowerCase());
    if (entry) return { word, entry };
  }
  return undefined;
}
