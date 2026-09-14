import { readFileSync, writeFileSync } from "node:fs";
import type { ExportFormat } from "../../prose/index.js";
import { parseDialogueFile, exportLines } from "../../prose/index.js";

export interface ExportCommandOptions {
  format: ExportFormat;
  out: string;
  node?: string;
}

/** Reads, exports, and writes; returns the exported content too so tests don't have to re-read the output file. */
export function runExportCommand(filePath: string, options: ExportCommandOptions): string {
  const text = readFileSync(filePath, "utf-8");
  const lines = parseDialogueFile(text);
  const exported = exportLines(
    lines,
    options.format,
    options.node !== undefined ? { node: options.node } : {},
  );
  writeFileSync(options.out, exported, "utf-8");
  return exported;
}
