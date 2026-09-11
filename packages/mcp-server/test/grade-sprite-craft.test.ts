import { describe, expect, it } from "vitest";
import { gradeSpriteCraftHandler } from "../src/tools/grade-sprite-craft.js";

describe("gradeSpriteCraftHandler", () => {
  it("returns no finding for a pass verdict", () => {
    const result = gradeSpriteCraftHandler({
      ruleId: "pillow-shading",
      description: "Barrel sprite, upper-left highlight, lower-right shadow throughout.",
      verdict: "pass",
      reasoning: "Highlight and shadow are consistent with one light direction.",
    });
    expect(result.structuredContent.verdict).toBe("pass");
    expect(result.structuredContent.finding).toBeUndefined();
  });

  it("structures a fail verdict into a Finding using the rubric's own fixHint", () => {
    const result = gradeSpriteCraftHandler({
      ruleId: "pillow-shading",
      description: "Well support post, bright center band, dark on both edges.",
      verdict: "fail",
      reasoning: "Every post is lightest in its center and dark on both edges symmetrically.",
      x: 12,
      y: 8,
    });
    expect(result.structuredContent.verdict).toBe("fail");
    expect(result.structuredContent.finding).toMatchObject({
      id: "visual.craft-rubric",
      ruleId: "pillow-shading",
      severity: "fail",
      location: { x: 12, y: 8 },
    });
    expect(result.structuredContent.finding?.fixHint).toContain("Pick one light-source");
    expect(result.structuredContent.finding?.message).toContain("Pillow shading");
  });

  it("throws a clear error for an unknown ruleId", () => {
    expect(() =>
      gradeSpriteCraftHandler({
        ruleId: "not-a-real-rule",
        description: "n/a",
        verdict: "pass",
        reasoning: "n/a",
      }),
    ).toThrow(/no Tier 2 rubric item named "not-a-real-rule"/);
  });
});
