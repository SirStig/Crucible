import type { DialogueLine } from "./types.js";

/**
 * "Speaker: line text" convention — a bare word/short phrase followed by a
 * colon and at least one non-space character. Deliberately requires the
 * speaker to start with a letter so numeric/timestamp-looking lines
 * ("3:00 the bell rings") are never mistaken for a speaker prefix.
 */
const SPEAKER_PATTERN = /^([A-Za-z][A-Za-z0-9 _'-]{0,39}):\s+(\S.*)$/;

/**
 * Parses raw dialogue/prose input into graded units, one per non-blank line.
 * Blank lines are dropped from the result but don't shift the `sourceLine`
 * numbering of the lines around them, so reported line numbers still match
 * what a human sees in the source file. A line with no "Speaker:" prefix is
 * treated as plain prose/UI text with `speaker` left unset.
 */
export function parseDialogueFile(input: string): DialogueLine[] {
  const rawLines = input.split(/\r\n|\r|\n/);
  const lines: DialogueLine[] = [];

  rawLines.forEach((raw, index) => {
    if (raw.trim().length === 0) return;

    const sourceLine = index + 1;
    const match = SPEAKER_PATTERN.exec(raw);
    if (match) {
      lines.push({
        sourceLine,
        raw,
        speaker: match[1]!,
        text: match[2]!.trimEnd(),
      });
    } else {
      lines.push({ sourceLine, raw, text: raw.trim() });
    }
  });

  return lines;
}
