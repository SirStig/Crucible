import { describe, expect, it } from "vitest";
import { packSpriteSheetHandler } from "../src/tools/pack-sprite-sheet.js";

function frame(color: string): { svg: string; gridWidth: number; gridHeight: number } {
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="4" height="4" fill="${color}"/></svg>`,
    gridWidth: 4,
    gridHeight: 4,
  };
}

describe("packSpriteSheetHandler", () => {
  it("packs frames and returns a PNG image block plus metadata", () => {
    const result = packSpriteSheetHandler({ frames: [frame("#f00"), frame("#0f0")], columns: 2 });
    expect(result.structuredContent.columns).toBe(2);
    expect(result.structuredContent.rows).toBe(1);
    expect(result.structuredContent.frames).toHaveLength(2);
    const image = result.content.find((c) => c.type === "image");
    expect(image?.mimeType).toBe("image/png");
  });

  it("throws a clear error for mismatched frame sizes", () => {
    const mismatched = { svg: frame("#00f").svg, gridWidth: 8, gridHeight: 8 };
    expect(() => packSpriteSheetHandler({ frames: [frame("#f00"), mismatched], columns: 2 })).toThrow(
      /must share the same grid size/,
    );
  });
});
