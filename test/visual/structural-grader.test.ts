import { describe, expect, it } from "vitest";
import { gradeStructure } from "../../src/visual/structural-grader.js";
import { gridFrom, gridFromFn } from "./helpers.js";

describe("gradeStructure", () => {
  it("finds nothing for content safely inside the canvas with clean opacity", () => {
    const grid = gridFrom([
      [null, null, null, null],
      [null, "#ff0000", "#ff0000", null],
      [null, "#ff0000", "#ff0000", null],
      [null, null, null, null],
    ]);
    expect(gradeStructure(grid)).toEqual([]);
  });

  it("flags content touching the canvas edge", () => {
    const grid = gridFrom([
      ["#ff0000", null],
      [null, null],
    ]);
    const findings = gradeStructure(grid);
    const edge = findings.find((f) => f.ruleId === "content-touches-canvas-edge");
    expect(edge).toBeDefined();
    expect(edge?.severity).toBe("warn");
    expect(edge?.data).toMatchObject({ count: 1 });
  });

  it("flags a significant fraction of partial-alpha pixels as a warn below the fail threshold", () => {
    // 20% partial alpha -> at/above the 10% warn floor, below the 30% fail floor.
    const grid = gridFromFn(10, 1, (x) => (x < 2 ? { r: 0, g: 0, b: 0, a: 128 } : "#000000"));
    const findings = gradeStructure(grid);
    const partial = findings.find((f) => f.ruleId === "partial-alpha-noise");
    expect(partial?.severity).toBe("warn");
  });

  it("escalates to fail once partial-alpha pixels dominate", () => {
    const grid = gridFromFn(10, 1, (x) => (x < 5 ? { r: 0, g: 0, b: 0, a: 128 } : "#000000"));
    const findings = gradeStructure(grid);
    const partial = findings.find((f) => f.ruleId === "partial-alpha-noise");
    expect(partial?.severity).toBe("fail");
  });

  it("does not flag partial alpha below the warn floor", () => {
    const grid = gridFromFn(20, 1, (x) => (x === 0 ? { r: 0, g: 0, b: 0, a: 128 } : "#000000"));
    const findings = gradeStructure(grid);
    expect(findings.some((f) => f.ruleId === "partial-alpha-noise")).toBe(false);
  });
});
