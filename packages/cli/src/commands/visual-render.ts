import { readFileSync, writeFileSync } from "node:fs";
import { renderSprite } from "crucible-visual";

export interface VisualRenderCommandOptions {
  gridWidth: number;
  gridHeight: number;
  out: string;
}

export function runVisualRenderCommand(
  filePath: string,
  options: VisualRenderCommandOptions,
): void {
  const svg = readFileSync(filePath, "utf-8");
  const rendered = renderSprite({
    svg,
    gridWidth: options.gridWidth,
    gridHeight: options.gridHeight,
  });
  writeFileSync(options.out, rendered.png);
}
