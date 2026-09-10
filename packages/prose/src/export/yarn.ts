import type { DialogueLine } from "../types.js";

export interface YarnExportOptions {
  node?: string;
}

const DEFAULT_NODE = "CanvasLoopExport";

function sanitizeNodeTitle(title: string): string {
  const cleaned = title.trim().replace(/[^A-Za-z0-9_]+/g, "_");
  return cleaned.length > 0 ? cleaned : DEFAULT_NODE;
}

function escapeYarnText(text: string): string {
  let escaped = text.replace(/([{}#])/g, "\\$1");
  if (escaped.startsWith("->")) escaped = `\\${escaped}`;
  if (escaped.startsWith("<<")) escaped = `\\${escaped}`;
  return escaped;
}

/**
 * Exports accepted lines as a single Yarn Spinner node. Yarn's native
 * "Speaker: text" line syntax means dialogue lines pass through almost
 * unchanged; characters that are otherwise significant to Yarn ({}, #, and
 * a leading -> or <<) are escaped so exported prose can't accidentally be
 * parsed as an expression, hashtag, divert, or shortcut option.
 */
export function toYarn(lines: DialogueLine[], options: YarnExportOptions = {}): string {
  const node = sanitizeNodeTitle(options.node ?? DEFAULT_NODE);
  const body = lines.map((line) => {
    const text = escapeYarnText(line.text);
    return line.speaker ? `${line.speaker}: ${text}` : text;
  });
  return [`title: ${node}`, "---", ...body, "===", ""].join("\n");
}
