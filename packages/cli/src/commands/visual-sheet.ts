import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { SpriteSheetFrame } from "@canvasloop/visual";
import { packSpriteSheet } from "@canvasloop/visual";

interface ManifestEntry {
  file: string;
  gridWidth: number;
  gridHeight: number;
  name?: string;
}

export interface VisualSheetCommandOptions {
  out: string;
  columns: number;
}

/**
 * Manifest is a JSON array of `{ file, gridWidth, gridHeight, name? }`,
 * with `file` resolved relative to the manifest's own directory.
 */
export function runVisualSheetCommand(
  manifestPath: string,
  options: VisualSheetCommandOptions,
): void {
  const manifestRaw = readFileSync(manifestPath, "utf-8");
  let manifest: ManifestEntry[];
  try {
    manifest = JSON.parse(manifestRaw) as ManifestEntry[];
  } catch (error) {
    throw new Error(`CanvasLoop: ${manifestPath} is not valid JSON: ${(error as Error).message}`, {
      cause: error,
    });
  }

  const baseDir = dirname(manifestPath);
  const frames: SpriteSheetFrame[] = manifest.map((entry) => ({
    svg: readFileSync(resolve(baseDir, entry.file), "utf-8"),
    gridWidth: entry.gridWidth,
    gridHeight: entry.gridHeight,
    ...(entry.name !== undefined ? { name: entry.name } : {}),
  }));

  const result = packSpriteSheet(frames, options.columns);
  writeFileSync(options.out, result.png);
}
