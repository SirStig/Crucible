import { describe, expect, it } from "vitest";
import { detectColorCount } from "../../src/detectors/color-count.js";
import { gridFrom } from "../helpers.js";

describe("detectColorCount", () => {
  it("finds nothing for a small set of clearly distinct colors", () => {
    const grid = gridFrom([["#ff0000", "#00ff00", "#0000ff"]]);
    const result = detectColorCount(grid);
    expect(result.findings).toEqual([]);
    expect(result.uniqueColorCount).toBe(3);
    expect(result.effectivePaletteSize).toBe(3);
  });

  it("clusters near-duplicate colors and flags the ratio", () => {
    const grid = gridFrom([["#ff0000", "#00ff00", "#0000ff", "#fe0101", "#fd0202"]]);
    const result = detectColorCount(grid);
    expect(result.uniqueColorCount).toBe(5);
    expect(result.effectivePaletteSize).toBe(3);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ ruleId: "too-many-similar-colors" });
    const groups = result.findings[0]?.data?.["mergedGroups"] as string[][];
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual(["#ff0000", "#fe0101", "#fd0202"]);
  });

  it("respects a custom cluster distance", () => {
    const grid = gridFrom([["#ff0000", "#f00000"]]); // very close colors
    expect(detectColorCount(grid, { colorClusterDistance: 1 }).effectivePaletteSize).toBe(2);
    expect(detectColorCount(grid, { colorClusterDistance: 50 }).effectivePaletteSize).toBe(1);
  });

  it("respects a custom ratio threshold", () => {
    const grid = gridFrom([["#ff0000", "#00ff00", "#fe0101"]]); // 3 unique, 2 effective -> ratio 1.5
    expect(detectColorCount(grid, { colorCountRatio: 2 }).findings).toEqual([]);
    expect(detectColorCount(grid, { colorCountRatio: 1.2 }).findings).toHaveLength(1);
  });

  it("handles a single-color image with no findings", () => {
    const grid = gridFrom([["#123456", "#123456"]]);
    const result = detectColorCount(grid);
    expect(result.uniqueColorCount).toBe(1);
    expect(result.effectivePaletteSize).toBe(1);
    expect(result.findings).toEqual([]);
  });
});
