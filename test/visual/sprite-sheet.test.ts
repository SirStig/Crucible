import { describe, expect, it } from "vitest";
import { packSpriteSheet } from "../../src/visual/sprite-sheet.js";

function frame(
  color: string,
  name?: string,
): { svg: string; gridWidth: number; gridHeight: number; name?: string } {
  const base = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="4" height="4" fill="${color}"/></svg>`,
    gridWidth: 4,
    gridHeight: 4,
  };
  return name !== undefined ? { ...base, name } : base;
}

describe("packSpriteSheet", () => {
  it("lays out frames left-to-right, top-to-bottom by column count", () => {
    const result = packSpriteSheet([frame("#f00", "a"), frame("#0f0", "b"), frame("#00f", "c")], 2);
    expect(result.columns).toBe(2);
    expect(result.rows).toBe(2);
    expect(result.frames).toEqual([
      { index: 0, name: "a", x: 0, y: 0, width: 4, height: 4 },
      { index: 1, name: "b", x: 4, y: 0, width: 4, height: 4 },
      { index: 2, name: "c", x: 0, y: 4, width: 4, height: 4 },
    ]);
  });

  it("produces a sheet PNG sized to columns/rows * cell size", () => {
    const result = packSpriteSheet([frame("#f00"), frame("#0f0")], 2);
    expect(result.png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("omits the name field on metadata for unnamed frames", () => {
    const result = packSpriteSheet([frame("#f00")], 1);
    expect(result.frames[0]).toEqual({ index: 0, x: 0, y: 0, width: 4, height: 4 });
  });

  it("throws a clear error for mismatched frame sizes", () => {
    const mismatched = {
      svg: `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="8" height="8" fill="#000"/></svg>`,
      gridWidth: 8,
      gridHeight: 8,
      name: "oops",
    };
    expect(() => packSpriteSheet([frame("#f00"), mismatched], 2)).toThrow(
      /must share the same grid size/,
    );
  });

  it("throws for an empty frame list", () => {
    expect(() => packSpriteSheet([], 2)).toThrow(RangeError);
  });

  it("throws for a non-positive column count", () => {
    expect(() => packSpriteSheet([frame("#f00")], 0)).toThrow(RangeError);
  });
});
