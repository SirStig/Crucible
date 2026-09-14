import { describe, expect, it } from "vitest";
import { generateFoliageHandler } from "../../src/mcp/tools/generate-foliage.js";

describe("generateFoliageHandler", () => {
  it("generates from a named preset", () => {
    const result = generateFoliageHandler({ preset: "fern" });
    expect(result.structuredContent.svg).toContain("<svg");
    expect(result.content.some((c) => c.type === "image")).toBe(false);
  });

  it("includes a rendered preview image when requested", () => {
    const result = generateFoliageHandler({ preset: "weed", includePreview: true });
    const image = result.content.find((c) => c.type === "image");
    expect(image).toBeDefined();
    expect(image?.mimeType).toBe("image/png");
  });

  it("generates from a custom spec", () => {
    const result = generateFoliageHandler({
      spec: { axiom: "F", rules: { F: "F[+F]F" }, iterations: 2, angleDegrees: 25, stepLength: 3 },
    });
    expect(result.structuredContent.width).toBeGreaterThan(0);
  });

  it("throws when neither preset nor spec is given", () => {
    expect(() => generateFoliageHandler({})).toThrow(/needs either `preset` or `spec`/);
  });

  it("throws a clear error for an unknown preset", () => {
    expect(() => generateFoliageHandler({ preset: "not-real" })).toThrow(/unknown foliage preset/);
  });
});
