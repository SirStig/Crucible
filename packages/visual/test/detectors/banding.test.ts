import { describe, expect, it } from "vitest";
import { detectBanding } from "../../src/detectors/banding.js";
import { gridFromFn } from "../helpers.js";

describe("detectBanding", () => {
  it("flags two elongated, same-hue-different-lightness regions sharing a straight border", () => {
    // Two 20x3 horizontal strips stacked, well past the default elongation
    // threshold (3), same red hue at two different lightness steps.
    const grid = gridFromFn(20, 6, (_x, y) => (y < 3 ? "#cc4444" : "#882222"));
    const findings = detectBanding(grid);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "banding", severity: "fail" });
    expect(findings[0]?.data).toMatchObject({ borderSpread: 0 });
  });

  it("does not flag regions that aren't elongated", () => {
    // Two roughly-square 6x6 blocks side by side: same hue relationship, but not strip-like.
    const grid = gridFromFn(12, 6, (x) => (x < 6 ? "#cc4444" : "#882222"));
    expect(detectBanding(grid)).toEqual([]);
  });

  it("does not flag elongated regions of unrelated hues", () => {
    // Elongated strips, but red vs. blue, not a shading step of the same hue.
    const grid = gridFromFn(20, 6, (_x, y) => (y < 3 ? "#ff0000" : "#0000ff"));
    expect(detectBanding(grid)).toEqual([]);
  });

  it("does not flag an elongated region adjacent to transparent background", () => {
    const grid = gridFromFn(20, 3, () => "#cc4444");
    expect(detectBanding(grid)).toEqual([]);
  });

  it("respects a custom elongation threshold", () => {
    // Two 8x4 regions -> elongation exactly 2.
    const grid = gridFromFn(8, 8, (_x, y) => (y < 4 ? "#cc4444" : "#882222"));
    expect(detectBanding(grid, { bandingElongationThreshold: 3 })).toEqual([]);
    expect(detectBanding(grid, { bandingElongationThreshold: 1.5 })).toHaveLength(1);
  });
});
