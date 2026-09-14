import { describe, expect, it } from "vitest";
import { detectEnclosedHoles } from "../../../src/visual/detectors/enclosed-holes.js";
import { gridFrom } from "../helpers.js";

describe("detectEnclosedHoles", () => {
  it("finds nothing for a fully solid shape", () => {
    const grid = gridFrom([
      ["#f00", "#f00", "#f00"],
      ["#f00", "#f00", "#f00"],
      ["#f00", "#f00", "#f00"],
    ]);
    expect(detectEnclosedHoles(grid)).toEqual([]);
  });

  it("does not flag transparent background reachable from the border", () => {
    const grid = gridFrom([
      ["#f00", "#f00", null],
      ["#f00", "#f00", null],
      [null, null, null],
    ]);
    expect(detectEnclosedHoles(grid)).toEqual([]);
  });

  it("flags a small transparent pixel fully sealed inside a ring", () => {
    const grid = gridFrom([
      ["#f00", "#f00", "#f00"],
      ["#f00", null, "#f00"],
      ["#f00", "#f00", "#f00"],
    ]);
    const findings = detectEnclosedHoles(grid);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ruleId: "unintended-hole",
      severity: "warn",
      data: { holePixelCount: 1 },
    });
  });

  it("does not flag a hole larger than the default max size", () => {
    const grid = gridFrom([
      ["#f00", "#f00", "#f00", "#f00", "#f00", "#f00"],
      ["#f00", null, null, null, null, "#f00"],
      ["#f00", null, null, null, null, "#f00"],
      ["#f00", null, null, null, null, "#f00"],
      ["#f00", "#f00", "#f00", "#f00", "#f00", "#f00"],
    ]);
    // 4x3 = 12px enclosed hole, well above the default 3px cutoff.
    expect(detectEnclosedHoles(grid)).toEqual([]);
  });

  it("respects a custom maxUnintendedHoleSize", () => {
    const grid = gridFrom([
      ["#f00", "#f00", "#f00", "#f00"],
      ["#f00", null, null, "#f00"],
      ["#f00", "#f00", "#f00", "#f00"],
    ]);
    // 2px enclosed hole.
    expect(detectEnclosedHoles(grid, { maxUnintendedHoleSize: 1 })).toEqual([]);
    expect(detectEnclosedHoles(grid, { maxUnintendedHoleSize: 2 })).toHaveLength(1);
  });
});
