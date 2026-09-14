import type { Finding, Severity } from "crucible-base";
import type { DialogueLine } from "../types.js";
import { loadAiTellData } from "../data-loader.js";
import { excerpt } from "../text-normalize.js";

const DEFAULT_MIN_OCCURRENCES_FOR_FAIL = 2;

interface TemplateMatch {
  line: DialogueLine;
  match: RegExpExecArray;
}

/**
 * Flags templated "balanced-contrast" constructions ("it's not just
 * X, it's Y" and its siblings, defined in the living data file's
 * `templates[]`). A single instance is just a rhetorical device; the same
 * template firing repeatedly across the document is a tic, so every match
 * of a template escalates to "fail" once it recurs at or past that
 * template's `minOccurrencesForFail` (default 2).
 */
export function detectBalancedConstruction(lines: DialogueLine[], phrasesFile?: string): Finding[] {
  const data = loadAiTellData(phrasesFile);
  const findings: Finding[] = [];

  for (const template of data.templates) {
    const threshold = template.minOccurrencesForFail ?? DEFAULT_MIN_OCCURRENCES_FOR_FAIL;
    const matches: TemplateMatch[] = [];
    const regex = new RegExp(template.pattern, "gi");

    for (const line of lines) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line.text)) !== null) {
        matches.push({ line, match });
        if (match[0].length === 0) regex.lastIndex += 1;
      }
    }

    if (matches.length === 0) continue;

    const repeated = matches.length >= threshold;
    const severity: Severity = repeated ? "fail" : template.severity;

    for (const { line, match } of matches) {
      const matched = match[0];
      findings.push({
        id: "prose.balanced-construction",
        ruleId: template.id,
        severity,
        message: repeated
          ? `The "${template.id}" construction shows up ${matches.length} times in this document, reading as a verbal tic rather than a deliberate rhetorical device.`
          : template.note
            ? `"${matched}" is a templated balanced-contrast construction (${template.note}).`
            : `"${matched}" is a templated balanced-contrast construction.`,
        location: {
          line: line.sourceLine,
          charStart: match.index,
          charEnd: match.index + matched.length,
          excerpt: excerpt(line.text, match.index, matched.length),
        },
        data: { matchedText: matched, occurrences: matches.length },
        fixHint: "Cut the phrase, restate the connection plainly, or drop it.",
      });
    }
  }

  return findings;
}
