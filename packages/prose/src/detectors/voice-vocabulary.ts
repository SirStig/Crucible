import type { Finding } from "@canvasloop/core";
import type { DialogueLine } from "../types.js";
import type { StyleProfileEntry } from "../data-loader.js";
import { excerpt } from "../text-normalize.js";

/**
 * FR18: flags vocabulary a character's style profile has explicitly marked
 * as not fitting their voice. Only runs when a profile is actually
 * supplied and has a non-empty `vocabulary.avoid` list — a document graded
 * with no profile gets none of these findings, deliberately, since there's
 * no universal "wrong word" without a target voice to be wrong for.
 */
export function detectVoiceVocabulary(
  lines: DialogueLine[],
  profile: StyleProfileEntry | undefined,
): Finding[] {
  const avoidWords = profile?.vocabulary?.avoid;
  if (!profile || !avoidWords || avoidWords.length === 0) return [];

  const findings: Finding[] = [];
  const registerNote = profile.register ? ` (${profile.register})` : "";

  for (const word of avoidWords) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    for (const line of lines) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line.text)) !== null) {
        const matched = match[0];
        findings.push({
          id: "prose.voice-vocabulary",
          ruleId: "voice-vocabulary-mismatch",
          severity: "warn",
          message: `"${matched}" doesn't fit ${profile.displayName}'s voice${registerNote} — it's listed as a word to avoid for this character.`,
          location: {
            line: line.sourceLine,
            charStart: match.index,
            charEnd: match.index + matched.length,
            excerpt: excerpt(line.text, match.index, matched.length),
          },
          data: { matchedText: matched, profileId: profile.id },
          fixHint: `Replace with vocabulary that fits ${profile.displayName}'s established voice.`,
        });
        if (matched.length === 0) regex.lastIndex += 1;
      }
    }
  }

  return findings;
}
