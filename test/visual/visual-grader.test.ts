import { describe, expect, it } from "vitest";
import { gradeSpritePattern, gradeRenderedSprite } from "../../src/visual/visual-grader.js";
import { renderSprite } from "../../src/visual/render.js";

describe("gradeSpritePattern", () => {
  it("passes cleanly on a simple, well-formed sprite", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="2" height="2" fill="#ff0000"/></svg>`;
    const result = gradeSpritePattern({ svg, gridWidth: 4, gridHeight: 4 });
    expect(result.status).toBe("pass");
    expect(result.findings).toEqual([]);
    expect(result.summary).toMatchObject({
      width: 4,
      height: 4,
      opaquePixelCount: 4,
      uniqueColorCount: 1,
      effectivePaletteSize: 1,
      empty: false,
    });
  });

  it("fails cleanly, with a named reason, on a fully transparent canvas", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"></svg>`;
    const result = gradeSpritePattern({ svg, gridWidth: 4, gridHeight: 4 });
    expect(result.status).toBe("fail");
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ ruleId: "empty-canvas" });
    expect(result.summary.empty).toBe(true);
  });

  it("surfaces multiple seeded issues from a single sprite", () => {
    // Elongated same-hue banding pair, plus a near-duplicate color, plus
    // content touching the edge -- three independent detectors should fire.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="20" height="3" fill="#cc4444"/>
      <rect x="0" y="3" width="20" height="3" fill="#882222"/>
      <rect x="0" y="6" width="1" height="1" fill="#fe0101"/>
    </svg>`;
    const result = gradeSpritePattern({ svg, gridWidth: 20, gridHeight: 7 });
    expect(result.status).toBe("fail");
    const ruleIds = result.findings.map((f) => f.ruleId);
    expect(ruleIds).toContain("banding");
    expect(ruleIds).toContain("content-touches-canvas-edge");
  });

  it("surfaces an unattached fragment through the full pipeline", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="6" height="6" fill="#4488cc"/>
      <rect x="8" y="0" width="1" height="1" fill="#4488cc"/>
    </svg>`;
    const result = gradeSpritePattern({ svg, gridWidth: 20, gridHeight: 20 });
    expect(result.findings.map((f) => f.ruleId)).toContain("unattached-fragment");
  });

  it("surfaces an unintended hole through the full pipeline", () => {
    // A 3x3 ring built from four strips (no fill in the middle), leaving a
    // literal 1px transparent gap sealed in the center.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="3" height="1" fill="#22aa66"/>
      <rect x="5" y="7" width="3" height="1" fill="#22aa66"/>
      <rect x="5" y="6" width="1" height="1" fill="#22aa66"/>
      <rect x="7" y="6" width="1" height="1" fill="#22aa66"/>
    </svg>`;
    const result = gradeSpritePattern({ svg, gridWidth: 20, gridHeight: 20 });
    expect(result.findings.map((f) => f.ruleId)).toContain("unintended-hole");
  });

  it("passes options through to the underlying detectors", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="0" width="20" height="4" fill="#cc4444"/>
      <rect x="2" y="4" width="20" height="4" fill="#882222"/>
    </svg>`;
    const strict = gradeSpritePattern(
      { svg, gridWidth: 24, gridHeight: 8 },
      { bandingElongationThreshold: 100 },
    );
    expect(strict.findings.some((f) => f.ruleId === "banding")).toBe(false);
  });
});

describe("gradeRenderedSprite", () => {
  it("grades a pre-rendered sprite without re-rendering", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="1" height="1" fill="#00ff00"/></svg>`;
    const rendered = renderSprite({ svg, gridWidth: 3, gridHeight: 3 });
    const result = gradeRenderedSprite(rendered);
    expect(result.status).toBe("pass");
    expect(result.summary.width).toBe(3);
  });
});
