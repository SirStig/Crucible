import type { Finding } from "crucible-base";
import type { DialogueLine } from "../types.js";
import type { PhraseEntry } from "../data-loader.js";
import { loadAiTellData } from "../data-loader.js";
import { excerpt } from "../text-normalize.js";

function buildPhraseRegex(phrase: PhraseEntry): RegExp {
  if (phrase.type === "literal") {
    const escaped = phrase.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "gi");
  }
  const flags = phrase.flags ?? "i";
  return new RegExp(phrase.pattern, flags.includes("g") ? flags : `${flags}g`);
}

/**
 * Flags matches against the living ai-tell-phrases.json phrase list:
 * overused transitions, hedges, and marketing-copy cliches that read as
 * machine-generated regardless of subject matter.
 */
export function detectAiTellPhrases(lines: DialogueLine[], phrasesFile?: string): Finding[] {
  const data = loadAiTellData(phrasesFile);
  const findings: Finding[] = [];

  for (const line of lines) {
    for (const phrase of data.phrases) {
      const regex = buildPhraseRegex(phrase);
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line.text)) !== null) {
        const matched = match[0];
        findings.push({
          id: "prose.ai-tell-phrase",
          ruleId: phrase.id,
          severity: phrase.severity,
          message: phrase.note
            ? `"${matched}" reads as a stock AI-tell phrase (${phrase.note}).`
            : `"${matched}" reads as a stock AI-tell phrase.`,
          location: {
            line: line.sourceLine,
            charStart: match.index,
            charEnd: match.index + matched.length,
            excerpt: excerpt(line.text, match.index, matched.length),
          },
          data: { matchedText: matched },
          fixHint: "Cut the phrase, restate the connection plainly, or drop it.",
        });
        if (matched.length === 0) regex.lastIndex += 1;
      }
    }
  }

  return findings;
}
