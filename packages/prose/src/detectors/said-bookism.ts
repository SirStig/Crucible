import type { Finding } from "crucible-base";
import type { DialogueLine } from "../types.js";
import type { BookismEntry } from "../data-loader.js";
import { loadSaidBookismData } from "../data-loader.js";
import { normalizeQuotes, excerpt } from "../text-normalize.js";

const CONTEXT_WORDS = 6;
const QUOTE_PATTERN = /"([^"]*)"/g;
const WORD_PATTERN = /[A-Za-z']+/g;

export interface SaidBookismResult {
  findings: Finding[];
  /** False when the input had no quoted spans at all. The check is then a documented no-op, not an error. */
  applicable: boolean;
}

/**
 * Flags said-bookisms: dialogue tags like "exclaimed" or "asserted"
 * standing in for a plain "said"/"asked" or an action beat. Looks at up to
 * `CONTEXT_WORDS` words immediately before and after each quoted span on a
 * line for a verb form listed in the living said-bookisms.json data.
 *
 * Also checks for a related, distinct pattern named by the same source
 * (the Turkey City Lexicon's "Tom Swifty" entry): a plain "said"/"asked"/
 * "replied" immediately paired with a manner adverb ("she said icily").
 * That's a structural check on the *allowed* verb list, not a lexicon
 * lookup, so it lives here in code rather than as banned-list data.
 */
export function detectSaidBookisms(
  lines: DialogueLine[],
  bookismsFile?: string,
): SaidBookismResult {
  const data = loadSaidBookismData(bookismsFile);
  const verbToEntry = new Map<string, BookismEntry>();
  for (const entry of data.banned) {
    for (const form of entry.forms) {
      verbToEntry.set(form.toLowerCase(), entry);
    }
  }
  const allowedVerbs = new Set(data.allowed.map((verb) => verb.toLowerCase()));

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
      const bookismHit = findBannedVerb(before, verbToEntry) ?? findBannedVerb(after, verbToEntry);
      const location = {
        line: line.sourceLine,
        excerpt: excerpt(normalized, quoteStart, quoteEnd - quoteStart),
      };

      if (bookismHit) {
        findings.push({
          id: "prose.said-bookism",
          ruleId: bookismHit.entry.id,
          severity: bookismHit.entry.severity,
          message: bookismHit.entry.note
            ? `"${bookismHit.word}" as a dialogue tag reads as a said-bookism (${bookismHit.entry.note}).`
            : `"${bookismHit.word}" as a dialogue tag reads as a said-bookism.`,
          location,
          data: { matchedVerb: bookismHit.word },
          fixHint: 'Replace with "said" (or drop the tag entirely) or cut to an action beat.',
        });
      } else {
        const swiftyHit = findTomSwifty(before, allowedVerbs) ?? findTomSwifty(after, allowedVerbs);
        if (swiftyHit) {
          findings.push({
            id: "prose.said-bookism",
            ruleId: "tom-swifty",
            severity: "info",
            message: `"${swiftyHit.verb} ${swiftyHit.adverb}" leans on an adverb to do the tag's work instead of the dialogue itself (a "Tom Swifty").`,
            location,
            data: { matchedVerb: swiftyHit.verb, matchedAdverb: swiftyHit.adverb },
            fixHint:
              "Cut the adverb and let the line's own wording carry the tone, or replace the tag with an action beat.",
          });
        }
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

// Common English adjectives/nouns that end in "-ly" but aren't manner
// adverbs, excluded to keep the Tom Swifty check from false-positiving on
// ordinary words like "she said only that much." This is a known,
// deliberately unsophisticated heuristic (no real part-of-speech tagging),
// documented rather than silently wrong.
const ADVERB_EXCLUSIONS = new Set([
  "only",
  "family",
  "supply",
  "apply",
  "reply",
  "holy",
  "early",
  "likely",
  "friendly",
  "lovely",
  "lonely",
  "ugly",
  "silly",
  "chilly",
  "monthly",
  "weekly",
  "daily",
  "curly",
  "bully",
  "rally",
  "belly",
  "jelly",
  "folly",
]);

function isLikelyMannerAdverb(word: string): boolean {
  const lower = word.toLowerCase();
  return lower.length > 3 && lower.endsWith("ly") && !ADVERB_EXCLUSIONS.has(lower);
}

function findTomSwifty(
  words: string[],
  allowedVerbs: Set<string>,
): { verb: string; adverb: string } | undefined {
  for (let i = 0; i < words.length - 1; i++) {
    const verb = words[i]!;
    const next = words[i + 1]!;
    if (allowedVerbs.has(verb.toLowerCase()) && isLikelyMannerAdverb(next)) {
      return { verb, adverb: next };
    }
  }
  return undefined;
}
