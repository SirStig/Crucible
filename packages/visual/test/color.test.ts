import { describe, expect, it } from "vitest";
import { rgbaEqual, rgbaKey, redmeanDistance, hexToRgba, rgbaToHex } from "../src/color.js";

describe("rgbaEqual / rgbaKey", () => {
  it("treats identical channels as equal", () => {
    expect(rgbaEqual({ r: 1, g: 2, b: 3, a: 4 }, { r: 1, g: 2, b: 3, a: 4 })).toBe(true);
  });

  it("treats any differing channel as unequal", () => {
    expect(rgbaEqual({ r: 1, g: 2, b: 3, a: 4 }, { r: 1, g: 2, b: 3, a: 5 })).toBe(false);
  });

  it("produces a stable, distinguishing key", () => {
    expect(rgbaKey({ r: 255, g: 0, b: 0, a: 255 })).toBe("255,0,0,255");
  });
});

describe("redmeanDistance", () => {
  it("is zero for identical colors", () => {
    expect(
      redmeanDistance({ r: 100, g: 100, b: 100, a: 255 }, { r: 100, g: 100, b: 100, a: 255 }),
    ).toBe(0);
  });

  it("is large for very different colors", () => {
    const d = redmeanDistance({ r: 255, g: 0, b: 0, a: 255 }, { r: 0, g: 0, b: 255, a: 255 });
    expect(d).toBeGreaterThan(300);
  });

  it("is small for near-identical colors", () => {
    const d = redmeanDistance({ r: 254, g: 1, b: 1, a: 255 }, { r: 253, g: 2, b: 2, a: 255 });
    expect(d).toBeLessThan(5);
  });

  it("is symmetric", () => {
    const a = { r: 10, g: 200, b: 40, a: 255 };
    const b = { r: 200, g: 10, b: 90, a: 255 };
    expect(redmeanDistance(a, b)).toBeCloseTo(redmeanDistance(b, a), 10);
  });
});

describe("hexToRgba / rgbaToHex", () => {
  it("parses a 6-digit hex color as opaque", () => {
    expect(hexToRgba("#ff0080")).toEqual({ r: 255, g: 0, b: 128, a: 255 });
  });

  it("expands a 3-digit hex color", () => {
    expect(hexToRgba("#f08")).toEqual({ r: 255, g: 0, b: 136, a: 255 });
  });

  it("accepts a hex color without a leading #", () => {
    expect(hexToRgba("00ff00")).toEqual({ r: 0, g: 255, b: 0, a: 255 });
  });

  it("throws a clear error for an invalid hex string", () => {
    expect(() => hexToRgba("not-a-color")).toThrow(/not a valid/);
  });

  it("round-trips through rgbaToHex", () => {
    expect(rgbaToHex(hexToRgba("#abcdef"))).toBe("#abcdef");
  });
});
