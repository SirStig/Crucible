import { describe, expect, it } from "vitest";
import { renderSprite } from "../src/render.js";

describe("renderSprite", () => {
  it("renders to the exact declared grid size", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1" height="1" fill="#ff0000"/></svg>`;
    const result = renderSprite({ svg, gridWidth: 5, gridHeight: 3 });
    expect(result.width).toBe(5);
    expect(result.height).toBe(3);
    expect(result.pixels.length).toBe(5 * 3 * 4);
  });

  it("overrides a mismatched width/height/viewBox already on the root element", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="999" height="999" viewBox="0 0 999 999"><rect x="0" y="0" width="1" height="1" fill="#00ff00"/></svg>`;
    const result = renderSprite({ svg, gridWidth: 4, gridHeight: 4 });
    expect(result.width).toBe(4);
    expect(result.height).toBe(4);
  });

  it("produces a real PNG buffer", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1" height="1" fill="#000"/></svg>`;
    const result = renderSprite({ svg, gridWidth: 2, gridHeight: 2 });
    expect(result.png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("renders pixels at exact 1:1 grid positions with crisp edges", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="2" width="1" height="1" fill="#ff0000"/></svg>`;
    const result = renderSprite({ svg, gridWidth: 4, gridHeight: 4 });
    const at = (x: number, y: number): number[] => {
      const i = (y * 4 + x) * 4;
      return [
        result.pixels[i]!,
        result.pixels[i + 1]!,
        result.pixels[i + 2]!,
        result.pixels[i + 3]!,
      ];
    };
    expect(at(1, 2)).toEqual([255, 0, 0, 255]);
    expect(at(0, 0)).toEqual([0, 0, 0, 0]);
  });

  it("rejects a non-positive grid dimension", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    expect(() => renderSprite({ svg, gridWidth: 0, gridHeight: 4 })).toThrow(RangeError);
    expect(() => renderSprite({ svg, gridWidth: 4, gridHeight: -1 })).toThrow(RangeError);
  });

  it("throws a clear error for input with no <svg> root", () => {
    expect(() => renderSprite({ svg: "<rect/>", gridWidth: 4, gridHeight: 4 })).toThrow(
      /does not contain an <svg> root/,
    );
  });

  it("throws a clear error for malformed SVG markup", () => {
    const broken = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1" height="1" fill="#ff0000"`; // unclosed
    expect(() => renderSprite({ svg: broken, gridWidth: 4, gridHeight: 4 })).toThrow(
      /could not parse SVG/,
    );
  });
});
