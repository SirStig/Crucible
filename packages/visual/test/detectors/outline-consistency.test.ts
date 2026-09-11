import { describe, expect, it } from "vitest";
import { detectOutlineConsistency } from "../../src/detectors/outline-consistency.js";
import { gridFromFn } from "../helpers.js";

/** A 6x6 square with a black ring outline and a light-gray fill; `gapAt` optionally breaks one border pixel. */
function ringSprite(gapAt?: { x: number; y: number }) {
  return gridFromFn(6, 6, (x, y) => {
    const isBorder = x === 0 || y === 0 || x === 5 || y === 5;
    if (!isBorder) return "#cccccc";
    if (gapAt && x === gapAt.x && y === gapAt.y) return "#ffffff";
    return "#000000";
  });
}

describe("detectOutlineConsistency", () => {
  it("finds nothing for a fully consistent outline", () => {
    expect(detectOutlineConsistency(ringSprite())).toEqual([]);
  });

  it("finds nothing on a fully transparent grid", () => {
    const grid = gridFromFn(4, 4, () => null);
    expect(detectOutlineConsistency(grid)).toEqual([]);
  });

  it("flags a single-pixel gap once the mismatch ratio clears a lowered threshold", () => {
    const findings = detectOutlineConsistency(ringSprite({ x: 0, y: 2 }), {
      outlineInconsistencyRatio: 0.03,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "outline-inconsistency" });
    expect(findings[0]?.data).toMatchObject({ dominantColor: "#000000", deviatingPixelCount: 1 });
  });

  it("does not flag the same single-pixel gap under the default threshold", () => {
    // 1 deviating pixel out of 20 contour pixels = 5%, below the default 15% floor.
    expect(detectOutlineConsistency(ringSprite({ x: 0, y: 2 }))).toEqual([]);
  });

  it("escalates to fail once the mismatch ratio is well past the threshold", () => {
    const grid = gridFromFn(6, 6, (x, y) => {
      const isBorder = x === 0 || y === 0 || x === 5 || y === 5;
      if (!isBorder) return "#cccccc";
      // Alternate two "outline" colors along the border -> roughly 50% mismatch either way.
      return (x + y) % 2 === 0 ? "#000000" : "#111111";
    });
    const findings = detectOutlineConsistency(grid, { outlineInconsistencyRatio: 0.1 });
    expect(findings[0]?.severity).toBe("fail");
  });
});
