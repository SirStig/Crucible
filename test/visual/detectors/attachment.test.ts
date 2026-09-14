import { describe, expect, it } from "vitest";
import { detectDisconnectedFragments } from "../../../src/visual/detectors/attachment.js";
import { gridFrom } from "../helpers.js";

describe("detectDisconnectedFragments", () => {
  it("finds nothing for a single connected blob", () => {
    const grid = gridFrom([
      ["#f00", "#f00", "#f00"],
      ["#f00", "#f00", "#f00"],
    ]);
    expect(detectDisconnectedFragments(grid)).toEqual([]);
  });

  it("does not flag diagonally-touching pixels (8-connectivity)", () => {
    const grid = gridFrom([
      ["#f00", null, null],
      [null, "#f00", null],
      [null, null, "#f00"],
    ]);
    expect(detectDisconnectedFragments(grid)).toEqual([]);
  });

  it("escalates to fail at the smallest possible gap (one blank column between)", () => {
    // Main body: 6px block, cols 0-2. One blank column (3). Fragment: col 4. gap = 2.
    const grid = gridFrom([
      ["#f00", "#f00", "#f00", null, "#f00"],
      ["#f00", "#f00", "#f00", null, null],
      ["#f00", "#f00", "#f00", null, null],
    ]);
    const findings = detectDisconnectedFragments(grid);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      ruleId: "unattached-fragment",
      severity: "fail",
      data: { gap: 2 },
    });
  });

  it("reports warn for a small fragment a bit further (but within default range) from the main body", () => {
    // Two blank columns (3, 4). Fragment: col 5. gap = 3.
    const grid = gridFrom([
      ["#f00", "#f00", "#f00", null, null, "#f00"],
      ["#f00", "#f00", "#f00", null, null, null],
      ["#f00", "#f00", "#f00", null, null, null],
    ]);
    const findings = detectDisconnectedFragments(grid);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "unattached-fragment", severity: "warn" });
  });

  it("does not flag a fragment that's far away (likely an intentional separate effect)", () => {
    // Four blank columns (3-6). Fragment: col 7. gap = 5, beyond the default max of 4.
    const grid = gridFrom([
      ["#f00", "#f00", "#f00", null, null, null, null, "#f00"],
      ["#f00", "#f00", "#f00", null, null, null, null, null],
      ["#f00", "#f00", "#f00", null, null, null, null, null],
    ]);
    expect(detectDisconnectedFragments(grid)).toEqual([]);
  });

  it("does not flag a fragment that's large relative to the main body", () => {
    const grid = gridFrom([
      ["#f00", "#f00", null, "#00f", "#00f"],
      ["#f00", "#f00", null, "#00f", "#00f"],
    ]);
    // Both blobs are the same size, so neither is "small relative to the main body."
    expect(detectDisconnectedFragments(grid)).toEqual([]);
  });

  it("respects custom maxFragmentSizeRatio and maxAttachmentGap", () => {
    const grid = gridFrom([
      ["#f00", "#f00", "#f00", null, "#f00"],
      ["#f00", "#f00", "#f00", null, null],
      ["#f00", "#f00", "#f00", null, null],
    ]);
    expect(detectDisconnectedFragments(grid, { maxAttachmentGap: 1 })).toEqual([]);
    expect(detectDisconnectedFragments(grid, { maxFragmentSizeRatio: 0.01 })).toEqual([]);
  });
});
