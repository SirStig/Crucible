import { describe, expect, it } from "vitest";
import { detectDithering } from "../../../src/visual/detectors/dithering.js";
import { gridFromFn } from "../helpers.js";

/** 20x10: solid red for the first 8 columns, solid blue after a dither band of `bandWidth` columns. */
function ditherBand(bandWidth: number) {
  return gridFromFn(20, 10, (x, y) => {
    if (x < 8) return "#ff0000";
    if (x < 8 + bandWidth) return (x + y) % 2 === 0 ? "#ff0000" : "#0000ff";
    return "#0000ff";
  });
}

describe("detectDithering", () => {
  it("does not flag a thin transition band", () => {
    expect(detectDithering(ditherBand(2))).toEqual([]);
  });

  it("flags a wide dithered field as covering a solid area", () => {
    const findings = detectDithering(ditherBand(10));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "dithering-overuse", severity: "fail" });
    expect(findings[0]?.data).toMatchObject({ width: 10, height: 10 });
  });

  it("finds nothing when there is no checkerboard pattern at all", () => {
    const grid = gridFromFn(10, 10, () => "#ff0000");
    expect(detectDithering(grid)).toEqual([]);
  });

  it("respects a custom max transition width", () => {
    const grid = ditherBand(4);
    expect(detectDithering(grid, { ditherMaxTransitionWidth: 5 })).toEqual([]);
    expect(detectDithering(grid, { ditherMaxTransitionWidth: 1 }).length).toBeGreaterThan(0);
  });

  it("does not treat two arbitrary adjacent solid colors as dithering", () => {
    const grid = gridFromFn(10, 10, (x) => (x < 5 ? "#ff0000" : "#0000ff"));
    expect(detectDithering(grid)).toEqual([]);
  });
});
