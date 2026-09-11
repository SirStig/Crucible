import { describe, expect, it } from "vitest";
import {
  expandLSystem,
  generateFoliageSvg,
  generateFoliagePreset,
  FOLIAGE_PRESETS,
} from "../src/foliage.js";
import { renderSprite } from "../src/render.js";

describe("expandLSystem", () => {
  it("applies the rewrite rules the declared number of iterations", () => {
    expect(expandLSystem("A", { A: "AB" }, 0)).toBe("A");
    expect(expandLSystem("A", { A: "AB" }, 1)).toBe("AB");
    expect(expandLSystem("A", { A: "AB" }, 2)).toBe("ABB");
  });

  it("passes symbols with no rule through unchanged", () => {
    expect(expandLSystem("A+B", { A: "AA" }, 1)).toBe("AA+B");
  });

  it("rejects an out-of-range iteration count", () => {
    expect(() => expandLSystem("A", {}, -1)).toThrow(RangeError);
    expect(() => expandLSystem("A", {}, 11)).toThrow(RangeError);
  });

  it("throws rather than growing without bound on a runaway expansion", () => {
    expect(() => expandLSystem("A", { A: "AAAAAAAAAA" }, 10)).toThrow(/exceeded/);
  });
});

describe("generateFoliageSvg", () => {
  it("produces a well-formed SVG with a nonzero size", () => {
    const result = generateFoliageSvg({
      axiom: "F",
      rules: { F: "F[+F]F[-F]F" },
      iterations: 2,
      angleDegrees: 25,
      stepLength: 4,
    });
    expect(result.svg).toContain("<svg");
    expect(result.svg).toContain("</svg>");
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it("is deterministic for the same spec", () => {
    const spec = {
      axiom: "F",
      rules: { F: "F[+F][-F]F" },
      iterations: 3,
      angleDegrees: 20,
      stepLength: 5,
    };
    expect(generateFoliageSvg(spec)).toEqual(generateFoliageSvg(spec));
  });

  it("produces output that actually renders", () => {
    const result = generateFoliageSvg({
      axiom: "F",
      rules: { F: "F[+F]F" },
      iterations: 2,
      angleDegrees: 30,
      stepLength: 3,
    });
    const rendered = renderSprite({
      svg: result.svg,
      gridWidth: result.width,
      gridHeight: result.height,
    });
    expect(rendered.width).toBe(result.width);
    expect(rendered.png.length).toBeGreaterThan(0);
  });

  it("draws nothing but still returns a minimal valid SVG for an axiom with no draw commands", () => {
    const result = generateFoliageSvg({
      axiom: "X",
      rules: {},
      iterations: 3,
      angleDegrees: 20,
      stepLength: 5,
    });
    expect(result.width).toBeGreaterThanOrEqual(1);
    expect(result.height).toBeGreaterThanOrEqual(1);
  });
});

describe("generateFoliagePreset", () => {
  it("has at least the documented presets", () => {
    expect(Object.keys(FOLIAGE_PRESETS)).toEqual(expect.arrayContaining(["fern", "bush", "weed"]));
  });

  it("generates a valid result for every preset without throwing", () => {
    for (const name of Object.keys(FOLIAGE_PRESETS)) {
      expect(() => generateFoliagePreset(name)).not.toThrow();
    }
  });

  it("throws a clear error for an unknown preset name", () => {
    expect(() => generateFoliagePreset("not-a-real-preset")).toThrow(/unknown foliage preset/);
  });

  it("allows overriding preset fields", () => {
    const result = generateFoliagePreset("weed", { iterations: 1 });
    const base = generateFoliagePreset("weed");
    expect(result.svg).not.toBe(base.svg);
  });
});
