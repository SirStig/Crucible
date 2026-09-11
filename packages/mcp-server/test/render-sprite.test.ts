import { describe, expect, it } from "vitest";
import { renderSpriteHandler } from "../src/tools/render-sprite.js";

describe("renderSpriteHandler", () => {
  it("returns an image content block and matching structured dimensions", () => {
    const result = renderSpriteHandler({
      svg: `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1" height="1" fill="#f00"/></svg>`,
      gridWidth: 8,
      gridHeight: 6,
    });
    expect(result.structuredContent).toEqual({ width: 8, height: 6 });
    const image = result.content.find((c) => c.type === "image");
    expect(image).toBeDefined();
    expect(image?.mimeType).toBe("image/png");
    expect(typeof image?.data).toBe("string");
    expect(Buffer.from(image!.data, "base64").subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("throws a clear error for invalid SVG", () => {
    expect(() => renderSpriteHandler({ svg: "<rect/>", gridWidth: 4, gridHeight: 4 })).toThrow(
      /does not contain an <svg> root/,
    );
  });
});
