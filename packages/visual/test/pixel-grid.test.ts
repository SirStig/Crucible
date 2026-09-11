import { describe, expect, it } from "vitest";
import { gridFrom } from "./helpers.js";

describe("PixelGrid basic access", () => {
  it("reads colors at valid coordinates", () => {
    const grid = gridFrom([
      ["#ff0000", "#00ff00"],
      [null, "#0000ff"],
    ]);
    expect(grid.colorAt(0, 0)).toEqual({ r: 255, g: 0, b: 0, a: 255 });
    expect(grid.colorAt(1, 1)).toEqual({ r: 0, g: 0, b: 255, a: 255 });
    expect(grid.isOpaque(0, 1)).toBe(false);
    expect(grid.isOpaque(1, 0)).toBe(true);
  });

  it("returns fully transparent for out-of-bounds reads", () => {
    const grid = gridFrom([["#ff0000"]]);
    expect(grid.colorAt(-1, 0)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(grid.colorAt(5, 5)).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it("counts opaque pixels correctly", () => {
    const grid = gridFrom([
      ["#ff0000", null],
      [null, "#00ff00"],
    ]);
    expect(grid.opaquePixelCount()).toBe(2);
  });

  it("collects unique colors in first-seen order without duplicates", () => {
    const grid = gridFrom([
      ["#ff0000", "#ff0000"],
      ["#00ff00", null],
    ]);
    expect(grid.uniqueColors()).toEqual([
      { r: 255, g: 0, b: 0, a: 255 },
      { r: 0, g: 255, b: 0, a: 255 },
    ]);
  });
});

describe("PixelGrid.floodFillRegions", () => {
  it("groups a contiguous L-shape into one region", () => {
    const grid = gridFrom([
      ["#ff0000", null],
      ["#ff0000", "#ff0000"],
    ]);
    const regions = grid.floodFillRegions();
    expect(regions).toHaveLength(1);
    expect(regions[0]?.pixels).toHaveLength(3);
  });

  it("does not connect same-color pixels touching only diagonally", () => {
    const grid = gridFrom([
      ["#ff0000", null],
      [null, "#ff0000"],
    ]);
    const regions = grid.floodFillRegions();
    expect(regions).toHaveLength(2);
    expect(regions.every((r) => r.pixels.length === 1)).toBe(true);
  });

  it("keeps differently-colored adjacent pixels in separate regions", () => {
    const grid = gridFrom([["#ff0000", "#00ff00"]]);
    const regions = grid.floodFillRegions();
    expect(regions).toHaveLength(2);
  });

  it("computes a correct bounding box per region", () => {
    const grid = gridFrom([
      ["#ff0000", "#ff0000", null],
      [null, "#ff0000", null],
    ]);
    const [region] = grid.floodFillRegions();
    expect(region).toMatchObject({ minX: 0, maxX: 1, minY: 0, maxY: 1 });
  });
});

describe("PixelGrid.connectedComponents", () => {
  it("merges differently-colored touching pixels into one component", () => {
    const grid = gridFrom([["#ff0000", "#00ff00"]]);
    const components = grid.connectedComponents();
    expect(components).toHaveLength(1);
    expect(components[0]?.pixels).toHaveLength(2);
  });

  it("connects diagonally-touching pixels (8-connectivity)", () => {
    const grid = gridFrom([
      ["#ff0000", null],
      [null, "#00ff00"],
    ]);
    const components = grid.connectedComponents();
    expect(components).toHaveLength(1);
  });

  it("keeps genuinely separate blobs apart", () => {
    const grid = gridFrom([["#ff0000", null, null, "#00ff00"]]);
    const components = grid.connectedComponents();
    expect(components).toHaveLength(2);
  });
});

describe("PixelGrid.enclosedTransparentRegions", () => {
  it("does not treat border-reachable transparent pixels as enclosed", () => {
    const grid = gridFrom([
      ["#000", "#000"],
      [null, null],
    ]);
    expect(grid.enclosedTransparentRegions()).toEqual([]);
  });

  it("finds a single transparent pixel fully sealed inside a ring", () => {
    const grid = gridFrom([
      ["#000", "#000", "#000"],
      ["#000", null, "#000"],
      ["#000", "#000", "#000"],
    ]);
    const holes = grid.enclosedTransparentRegions();
    expect(holes).toHaveLength(1);
    expect(holes[0]?.pixels).toHaveLength(1);
  });

  it("groups a multi-pixel enclosed hole into one component", () => {
    const grid = gridFrom([
      ["#000", "#000", "#000", "#000"],
      ["#000", null, null, "#000"],
      ["#000", "#000", "#000", "#000"],
    ]);
    const holes = grid.enclosedTransparentRegions();
    expect(holes).toHaveLength(1);
    expect(holes[0]?.pixels).toHaveLength(2);
  });
});

describe("PixelGrid.contourPixels", () => {
  it("excludes the interior of a solid block", () => {
    const grid = gridFrom([
      ["#000", "#000", "#000"],
      ["#000", "#000", "#000"],
      ["#000", "#000", "#000"],
    ]);
    const contour = grid.contourPixels();
    // 8 border pixels out of 9; the center (1,1) is fully interior.
    expect(contour).toHaveLength(8);
    expect(contour.some((p) => p.x === 1 && p.y === 1)).toBe(false);
  });

  it("returns every pixel of a single-pixel-wide shape", () => {
    const grid = gridFrom([["#000", "#000", "#000"]]);
    expect(grid.contourPixels()).toHaveLength(3);
  });

  it("returns an empty contour for a fully transparent grid", () => {
    const grid = gridFrom([[null, null]]);
    expect(grid.contourPixels()).toEqual([]);
  });
});
