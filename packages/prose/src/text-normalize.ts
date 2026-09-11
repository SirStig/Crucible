const SMART_QUOTE_MAP: Record<string, string> = {
  "“": '"',
  "”": '"',
  "„": '"',
  "‘": "'",
  "’": "'",
  "‚": "'",
};

/** Normalizes curly/smart quotes to straight ones, for matching purposes only. */
export function normalizeQuotes(text: string): string {
  return text.replace(/[“”„‘’‚]/g, (char) => SMART_QUOTE_MAP[char] ?? char);
}

const WORD_PATTERN = /[\p{L}\p{N}]+/gu;

/** Unicode-aware word tokenizer: letters and digits only, lowercased. */
export function tokenize(text: string): string[] {
  return Array.from(text.toLowerCase().matchAll(WORD_PATTERN), (match) => match[0]);
}

/**
 * ~120 common English function words. Filtering these before the redundancy
 * check keeps short, low-content lines ("Was it him?" vs. "Was it her?")
 * from registering as near-duplicates just because they share connective
 * tissue, not meaning.
 */
export const STOPWORDS = new Set<string>([
  "a",
  "am",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "both",
  "but",
  "by",
  "can",
  "cannot",
  "could",
  "did",
  "do",
  "does",
  "doing",
  "down",
  "each",
  "few",
  "for",
  "from",
  "further",
  "had",
  "has",
  "have",
  "having",
  "he",
  "her",
  "here",
  "hers",
  "herself",
  "him",
  "himself",
  "his",
  "how",
  "i",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "itself",
  "just",
  "me",
  "more",
  "most",
  "my",
  "myself",
  "no",
  "nor",
  "not",
  "now",
  "of",
  "off",
  "on",
  "once",
  "only",
  "or",
  "other",
  "our",
  "ours",
  "ourselves",
  "out",
  "over",
  "own",
  "same",
  "she",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "theirs",
  "them",
  "themselves",
  "then",
  "there",
  "these",
  "they",
  "this",
  "those",
  "through",
  "to",
  "too",
  "under",
  "until",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "whom",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
  "yours",
  "yourself",
  "yourselves",
]);

const STEM_SUFFIXES: ReadonlyArray<{ suffix: string; replacement: string }> = [
  { suffix: "ing", replacement: "" },
  { suffix: "ies", replacement: "y" },
  { suffix: "es", replacement: "" },
  { suffix: "ed", replacement: "" },
  { suffix: "est", replacement: "" },
  { suffix: "er", replacement: "" },
  { suffix: "s", replacement: "" },
];

/**
 * Deliberately light, English-only suffix stripper — not a full Porter
 * stemmer. Only applied to lowercase-alphabetic tokens (non-Latin-script
 * tokens pass through untouched), and only strips a suffix when at least 3
 * characters of stem remain, to avoid mangling short words.
 */
export function stem(token: string): string {
  if (!/^[a-z]+$/.test(token) || token.length <= 3) return token;

  for (const { suffix, replacement } of STEM_SUFFIXES) {
    if (token.endsWith(suffix) && token.length - suffix.length >= 3) {
      return token.slice(0, token.length - suffix.length) + replacement;
    }
  }
  return token;
}

/** Tokenize -> lowercase -> drop stopwords -> stem. The unit used by the redundant-restating check. */
export function contentTokens(text: string): string[] {
  return tokenize(text)
    .filter((token) => !STOPWORDS.has(token))
    .map(stem);
}

/**
 * Tokenize -> lowercase -> drop stopwords, deliberately *without* stemming.
 * Used where the matched word itself gets shown back to a reader (the
 * word-repetition check): `stem()` is a blunt suffix-stripper that doesn't
 * know "nothing" isn't a gerund, and reporting "noth" as the overused word
 * would look like a bug rather than a stemming tradeoff.
 */
export function contentWords(text: string): string[] {
  return tokenize(text).filter((token) => !STOPWORDS.has(token));
}

/**
 * Builds a short surrounding-context string for a regex match, for a
 * human-readable report. Truncated sides get an ellipsis marker.
 */
export function excerpt(text: string, index: number, matchLength: number, radius = 20): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + matchLength + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}
