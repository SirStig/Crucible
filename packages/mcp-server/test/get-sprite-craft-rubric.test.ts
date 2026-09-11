import { describe, expect, it } from "vitest";
import { getSpriteCraftRubricHandler } from "../src/tools/get-sprite-craft-rubric.js";

describe("getSpriteCraftRubricHandler", () => {
  it("returns every rubric item when no ruleId is given", () => {
    const result = getSpriteCraftRubricHandler({});
    expect(result.structuredContent.rubric.length).toBeGreaterThanOrEqual(6);
    expect(result.structuredContent.rubric.map((r) => r.id)).toContain("pillow-shading");
  });

  it("returns exactly one item when a valid ruleId is given", () => {
    const result = getSpriteCraftRubricHandler({ ruleId: "pillow-shading" });
    expect(result.structuredContent.rubric).toHaveLength(1);
    expect(result.structuredContent.rubric[0]).toMatchObject({
      id: "pillow-shading",
      name: "Pillow shading",
    });
    expect(result.structuredContent.rubric[0]?.fixHint).toBeTruthy();
  });

  it("throws a clear error for an unknown ruleId", () => {
    expect(() => getSpriteCraftRubricHandler({ ruleId: "not-a-real-rule" })).toThrow(
      /no Tier 2 rubric item named "not-a-real-rule"/,
    );
  });

  it("includes hue-shifting, selective-outlining, silhouette-readability, and value-contrast-range", () => {
    const result = getSpriteCraftRubricHandler({});
    const ids = result.structuredContent.rubric.map((r) => r.id);
    expect(ids).toContain("hue-shifting");
    expect(ids).toContain("selective-outlining");
    expect(ids).toContain("silhouette-readability");
    expect(ids).toContain("value-contrast-range");
    expect(ids).toContain("light-source-consistency");
  });
});
