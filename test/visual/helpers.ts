import { PixelGrid } from "../../src/visual/pixel-grid.js";
import { hexToRgba } from "../../src/visual/color.js";
import type { RGBA } from "../../src/visual/color.js";

/** One cell: a hex color (opaque), `null` (fully transparent), or an explicit RGBA (for partial alpha). */
export type Cell = string | null | RGBA;

/** Builds a PixelGrid from a row-major grid of cells, for detector unit tests that don't need real SVG rendering. */
export function gridFrom(rows: Cell[][]): PixelGrid {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const data = Buffer.alloc(width * height * 4);
  rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === null) return; // already zeroed = transparent
      const rgba = typeof cell === "string" ? hexToRgba(cell) : cell;
      const i = (y * width + x) * 4;
      data[i] = rgba.r;
      data[i + 1] = rgba.g;
      data[i + 2] = rgba.b;
      data[i + 3] = rgba.a;
    });
  });
  return new PixelGrid(width, height, data);
}

/** Builds an `n`x`n` grid of rows/columns from a fill function, for larger procedurally-defined fixtures. */
export function gridFromFn(
  width: number,
  height: number,
  fill: (x: number, y: number) => Cell,
): PixelGrid {
  const rows: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) row.push(fill(x, y));
    rows.push(row);
  }
  return gridFrom(rows);
}
