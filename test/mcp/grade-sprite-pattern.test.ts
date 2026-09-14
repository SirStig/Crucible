import { describe, expect, it } from "vitest";
import { gradeSpritePatternHandler } from "../../src/mcp/tools/grade-sprite-pattern.js";

describe("gradeSpritePatternHandler", () => {
  it("passes cleanly on a simple sprite and includes an image block", () => {
    const result = gradeSpritePatternHandler({
      svg: `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="2" height="2" fill="#00f"/></svg>`,
      gridWidth: 4,
      gridHeight: 4,
    });
    expect(result.structuredContent.status).toBe("pass");
    expect(result.content.some((c) => c.type === "image")).toBe(true);
  });

  it("flags a seeded banding issue", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="20" height="3" fill="#cc4444"/>
      <rect x="0" y="3" width="20" height="3" fill="#882222"/>
    </svg>`;
    const result = gradeSpritePatternHandler({ svg, gridWidth: 20, gridHeight: 6 });
    expect(result.structuredContent.status).toBe("fail");
    expect(result.structuredContent.findings.some((f) => f.ruleId === "banding")).toBe(true);
  });

  it("passes options through to the underlying grader", () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="20" height="3" fill="#cc4444"/>
      <rect x="0" y="3" width="20" height="3" fill="#882222"/>
    </svg>`;
    const result = gradeSpritePatternHandler({
      svg,
      gridWidth: 20,
      gridHeight: 6,
      options: { bandingElongationThreshold: 1000 },
    });
    expect(result.structuredContent.findings.some((f) => f.ruleId === "banding")).toBe(false);
  });

  it("reports a clean empty-canvas fail without throwing", () => {
    const result = gradeSpritePatternHandler({
      svg: `<svg xmlns="http://www.w3.org/2000/svg"></svg>`,
      gridWidth: 4,
      gridHeight: 4,
    });
    expect(result.structuredContent.status).toBe("fail");
    expect(result.structuredContent.findings[0]?.ruleId).toBe("empty-canvas");
  });
});
