import { describe, expect, it } from "vitest";
import { loadVisualCraftRubricData } from "../../src/visual/data-loader.js";

describe("loadVisualCraftRubricData", () => {
  it("loads and validates the bundled Tier 2 rubric", () => {
    const data = loadVisualCraftRubricData();
    expect(data.rubric.length).toBeGreaterThanOrEqual(6);
    const ids = data.rubric.map((entry) => entry.id);
    expect(ids).toContain("pillow-shading");
    expect(ids).toContain("light-source-consistency");
    expect(ids).toContain("hue-shifting");
    expect(ids).toContain("selective-outlining");
    expect(ids).toContain("silhouette-readability");
    expect(ids).toContain("value-contrast-range");
    expect(ids).toContain("shape-proportion-plausibility");
  });

  it("every rubric entry has a non-empty fixHint and howToCheck", () => {
    const data = loadVisualCraftRubricData();
    for (const entry of data.rubric) {
      expect(entry.fixHint.length).toBeGreaterThan(0);
      expect(entry.howToCheck.length).toBeGreaterThan(0);
    }
  });

  it("caches by path and returns the same parsed object on repeat calls", () => {
    const first = loadVisualCraftRubricData();
    const second = loadVisualCraftRubricData();
    expect(first).toBe(second);
  });
});
