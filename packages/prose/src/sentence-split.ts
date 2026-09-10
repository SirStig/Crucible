/**
 * Common abbreviations that end in a period without ending a sentence.
 * Matched literally, so order doesn't matter beyond readability.
 */
const ABBREVIATIONS = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Mx.",
  "Dr.",
  "Prof.",
  "St.",
  "Jr.",
  "Sr.",
  "vs.",
  "etc.",
  "e.g.",
  "i.e.",
  "a.m.",
  "p.m.",
  "U.S.",
  "U.K.",
  "Ph.D.",
];

// ASCII control character (SOH) used as a sentinel: it can't occur in real
// prose/dialogue text, so wrapping placeholders in it guarantees they never
// collide with the input while staying plain, readable ASCII in this file.
const SENTINEL = String.fromCharCode(1);
const abbrPlaceholder = (index: number): string => `${SENTINEL}ABBR${index}${SENTINEL}`;
const ELLIPSIS_PLACEHOLDER = `${SENTINEL}ELLIPSIS${SENTINEL}`;
const ELLIPSIS_UNICODE_PLACEHOLDER = `${SENTINEL}ELLIPSISU${SENTINEL}`;

const SENTENCE_BOUNDARY = /(?<=[.!?]["'”’)]?)\s+(?=[A-Z0-9"'“‘])/;
const HAS_WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Splits text into sentences for the rhythm check. Ellipses are treated as
 * internal punctuation (never a sentence boundary) rather than guessing
 * whether "..." ends a thought or trails off mid-thought -- either reading
 * is defensible, but *not* splitting keeps the word-count stat from being
 * skewed by fragments. Abbreviations are protected so "Dr. Vance" doesn't
 * get cut in half. Sentences that are pure punctuation (no letters or
 * digits) are dropped rather than counted.
 */
export function splitSentences(text: string): string[] {
  if (text.trim().length === 0) return [];

  let protectedText = text
    .replace(/\.\.\./g, ELLIPSIS_PLACEHOLDER)
    .replace(/…/g, ELLIPSIS_UNICODE_PLACEHOLDER);

  ABBREVIATIONS.forEach((abbr, index) => {
    const escaped = abbr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    protectedText = protectedText.replace(new RegExp(escaped, "g"), abbrPlaceholder(index));
  });

  const rawSentences = protectedText.split(SENTENCE_BOUNDARY);

  const sentences = rawSentences.map((sentence) => {
    let restored = sentence;
    ABBREVIATIONS.forEach((abbr, index) => {
      restored = restored.split(abbrPlaceholder(index)).join(abbr);
    });
    restored = restored.split(ELLIPSIS_PLACEHOLDER).join("...");
    restored = restored.split(ELLIPSIS_UNICODE_PLACEHOLDER).join("…");
    return restored.trim();
  });

  return sentences.filter((sentence) => HAS_WORD_CHAR.test(sentence));
}
