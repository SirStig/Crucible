import type { SpriteInput } from "./types.js";
import { renderSprite } from "./render.js";
import { normalizeSvgRoot } from "./svg-utils.js";

export interface SpriteSheetFrame extends SpriteInput {
  /** Optional label carried through to the output metadata (e.g. a pose/animation-frame name). */
  name?: string;
}

export interface SpriteSheetFrameMeta {
  index: number;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpriteSheetResult {
  png: Buffer;
  svg: string;
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  frames: SpriteSheetFrameMeta[];
}

/**
 * Lays out N independently-rendered frames into one grid-aligned sheet.
 * Every frame must share the same declared grid size — mismatched frames
 * are a clear, structural-grader-style error (a caller mistake to fix),
 * not something to silently stretch/pad into place.
 */
export function packSpriteSheet(frames: SpriteSheetFrame[], columns: number): SpriteSheetResult {
  if (frames.length === 0) {
    throw new RangeError("CanvasLoop: packSpriteSheet needs at least one frame.");
  }
  if (!Number.isInteger(columns) || columns <= 0) {
    throw new RangeError("CanvasLoop: columns must be a positive integer.");
  }

  const cellWidth = frames[0]!.gridWidth;
  const cellHeight = frames[0]!.gridHeight;
  const mismatched = frames.find((f) => f.gridWidth !== cellWidth || f.gridHeight !== cellHeight);
  if (mismatched) {
    throw new Error(
      `CanvasLoop: all frames must share the same grid size to pack into a sheet — frame 0 is ${cellWidth}x${cellHeight}, but "${mismatched.name ?? "a later frame"}" is ${mismatched.gridWidth}x${mismatched.gridHeight}.`,
    );
  }

  const rows = Math.ceil(frames.length / columns);
  const sheetWidth = columns * cellWidth;
  const sheetHeight = rows * cellHeight;

  const meta: SpriteSheetFrameMeta[] = [];
  const embeddedGroups: string[] = [];

  frames.forEach((frame, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = col * cellWidth;
    const y = row * cellHeight;

    meta.push({
      index,
      ...(frame.name !== undefined ? { name: frame.name } : {}),
      x,
      y,
      width: cellWidth,
      height: cellHeight,
    });

    const inner = normalizeSvgRoot(frame.svg, cellWidth, cellHeight).replace(/<svg\b[^>]*>|<\/svg>/gi, "");
    embeddedGroups.push(`<g transform="translate(${x},${y})">${inner}</g>`);
  });

  const sheetSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sheetWidth}" height="${sheetHeight}" viewBox="0 0 ${sheetWidth} ${sheetHeight}">\n  ${embeddedGroups.join("\n  ")}\n</svg>\n`;

  const rendered = renderSprite({ svg: sheetSvg, gridWidth: sheetWidth, gridHeight: sheetHeight });

  return {
    png: rendered.png,
    svg: sheetSvg,
    columns,
    rows,
    cellWidth,
    cellHeight,
    frames: meta,
  };
}
