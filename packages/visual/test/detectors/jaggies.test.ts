import { describe, expect, it } from "vitest";
import { detectJaggies } from "../../src/detectors/jaggies.js";
import { gridFromFn } from "../helpers.js";

/** A filled staircase: `widths[i]` columns of run before stepping down one row, for `widths.length` steps. */
function staircase(widths: number[]): ReturnType<typeof gridFromFn> {
  const height = widths.length;
  const width = widths.reduce((a, b) => a + b, 0);
  // Precompute the top-of-fill row for each column.
  const stepAtColumn: number[] = [];
  widths.forEach((w, step) => {
    for (let i = 0; i < w; i++) stepAtColumn.push(step);
  });
  return gridFromFn(width, height, (x, y) => (y >= stepAtColumn[x]! ? "#333333" : null));
}

describe("detectJaggies", () => {
  it("does not flag a perfectly regular staircase", () => {
    const grid = staircase([2, 2, 2, 2, 2, 2, 2, 2]);
    expect(detectJaggies(grid)).toEqual([]);
  });

  it("flags an irregular staircase", () => {
    const grid = staircase([1, 5, 1, 6, 1, 5, 1, 6]);
    const findings = detectJaggies(grid);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0]).toMatchObject({ ruleId: "jaggies" });
    expect(findings[0]?.data?.["treadLengths"]).toEqual([5, 1, 6, 1, 5, 1]);
  });

  it("skips a run shorter than the minimum before judging it", () => {
    // Only 3 steps -- fewer than MIN_TREADS_FOR_JUDGMENT + 1 positions, so no verdict either way.
    const grid = staircase([3, 1, 4]);
    expect(detectJaggies(grid)).toEqual([]);
  });

  it("does not flag a flat edge (no diagonal at all)", () => {
    const grid = gridFromFn(10, 3, () => "#333333");
    expect(detectJaggies(grid)).toEqual([]);
  });

  it("respects a custom CV threshold", () => {
    const grid = staircase([2, 3, 2, 3, 2, 3, 2, 3]); // mild, consistent alternation
    expect(detectJaggies(grid, { jaggiesTreadCv: 0.9 })).toEqual([]);
    expect(detectJaggies(grid, { jaggiesTreadCv: 0.05 }).length).toBeGreaterThan(0);
  });
});
