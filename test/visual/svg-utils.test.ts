import { describe, expect, it } from "vitest";
import { normalizeSvgRoot } from "../../src/visual/svg-utils.js";

describe("normalizeSvgRoot", () => {
  it("injects width/height/viewBox onto a root with none", () => {
    const result = normalizeSvgRoot("<svg><rect/></svg>", 8, 6);
    expect(result).toContain('width="8"');
    expect(result).toContain('height="6"');
    expect(result).toContain('viewBox="0 0 8 6"');
  });

  it("overrides existing width/height/viewBox rather than duplicating them", () => {
    const result = normalizeSvgRoot(
      '<svg width="999" height="999" viewBox="0 0 999 999"><rect/></svg>',
      4,
      4,
    );
    expect(result.match(/width=/g)).toHaveLength(1);
    expect(result.match(/height=/g)).toHaveLength(1);
    expect(result).toContain('width="4"');
    expect(result).not.toContain("999");
  });

  it("adds an xmlns when missing, and doesn't duplicate one that's present", () => {
    const withoutNs = normalizeSvgRoot("<svg><rect/></svg>", 2, 2);
    expect(withoutNs.match(/xmlns=/g)).toHaveLength(1);

    const withNs = normalizeSvgRoot('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>', 2, 2);
    expect(withNs.match(/xmlns=/g)).toHaveLength(1);
  });

  it("preserves the rest of the SVG content untouched", () => {
    const result = normalizeSvgRoot(
      '<svg><rect x="1" y="1" width="1" height="1" fill="#f00"/></svg>',
      3,
      3,
    );
    expect(result).toContain('<rect x="1" y="1" width="1" height="1" fill="#f00"/>');
  });

  it("throws a clear error when there is no <svg> root element", () => {
    expect(() => normalizeSvgRoot("<rect/>", 4, 4)).toThrow(/does not contain an <svg> root/);
  });
});
