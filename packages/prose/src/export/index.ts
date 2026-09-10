import type { DialogueLine } from "../types.js";
import { toInk } from "./ink.js";
import { toYarn } from "./yarn.js";
import { toJsonTable } from "./json-table.js";
import { toStringsTable } from "./strings-table.js";

export type ExportFormat = "ink" | "yarn" | "json" | "strings";

export interface ExportOptions {
  /** Ink export only: overrides the generated-file header comment. */
  header?: string;
  /** Yarn export only: overrides the node title (default "CanvasLoopExport"). */
  node?: string;
}

export function exportLines(
  lines: DialogueLine[],
  format: ExportFormat,
  options: ExportOptions = {},
): string {
  switch (format) {
    case "ink":
      return toInk(lines, options.header !== undefined ? { header: options.header } : {});
    case "yarn":
      return toYarn(lines, options.node !== undefined ? { node: options.node } : {});
    case "json":
      return toJsonTable(lines);
    case "strings":
      return toStringsTable(lines);
    default: {
      const exhaustiveCheck: never = format;
      throw new Error(`Unknown export format: ${String(exhaustiveCheck)}`);
    }
  }
}

export { toInk } from "./ink.js";
export { toYarn } from "./yarn.js";
export { toJsonTable, lineKey } from "./json-table.js";
export { toStringsTable } from "./strings-table.js";
export type { InkExportOptions } from "./ink.js";
export type { YarnExportOptions } from "./yarn.js";
export type { JsonTableEntry, JsonTableExport } from "./json-table.js";
