import type { DialogueLine } from "../types.js";

export interface JsonTableEntry {
  key: string;
  speaker: string | null;
  text: string;
}

export interface JsonTableExport {
  format: "crucible-strings";
  version: 1;
  generatedAt: string;
  entries: JsonTableEntry[];
}

export function lineKey(sourceLine: number): string {
  return `line_${String(sourceLine).padStart(4, "0")}`;
}

/**
 * Exports accepted lines as a keyed JSON string table: a plain, engine-
 * agnostic format for UI text with no native place for narrative structure.
 * Keys are deterministic, sortable, and collision-free: they're derived
 * from the original source line number, which parseDialogueFile guarantees
 * is unique per graded line.
 */
export function toJsonTable(lines: DialogueLine[]): string {
  const payload: JsonTableExport = {
    format: "crucible-strings",
    version: 1,
    generatedAt: new Date().toISOString(),
    entries: lines.map((line) => ({
      key: lineKey(line.sourceLine),
      speaker: line.speaker ?? null,
      text: line.text,
    })),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}
