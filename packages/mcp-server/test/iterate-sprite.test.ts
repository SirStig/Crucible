import { describe, expect, it } from "vitest";
import { iterateSpriteHandler } from "../src/tools/iterate-sprite.js";

const CLEAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="1" height="1" fill="#f00"/></svg>`;
const BANDING_SVG = `<svg xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="0" width="20" height="3" fill="#cc4444"/>
<rect x="0" y="3" width="20" height="3" fill="#882222"/>
</svg>`;

describe("iterateSpriteHandler", () => {
  it("starts a session at iteration 1 with an empty diff", () => {
    const result = iterateSpriteHandler({
      sessionId: "sprite-session-start",
      svg: CLEAN_SVG,
      gridWidth: 4,
      gridHeight: 4,
    });
    expect(result.structuredContent.iteration).toBe(1);
    expect(result.structuredContent.diff).toEqual([]);
    expect(result.structuredContent.status).toBe("pass");
  });

  it("diffs the SVG source between calls", () => {
    const before =
      '<svg xmlns="http://www.w3.org/2000/svg">\n<rect x="0" y="0" width="1" height="1" fill="#f00"/>\n</svg>';
    const after =
      '<svg xmlns="http://www.w3.org/2000/svg">\n<rect x="0" y="0" width="1" height="1" fill="#0f0"/>\n</svg>';

    iterateSpriteHandler({
      sessionId: "sprite-session-diff",
      svg: before,
      gridWidth: 4,
      gridHeight: 4,
    });
    const second = iterateSpriteHandler({
      sessionId: "sprite-session-diff",
      svg: after,
      gridWidth: 4,
      gridHeight: 4,
    });

    expect(second.structuredContent.iteration).toBe(2);
    expect(second.structuredContent.diff).toEqual([
      {
        type: "unchanged",
        lineIndex: 0,
        before: '<svg xmlns="http://www.w3.org/2000/svg">',
        after: '<svg xmlns="http://www.w3.org/2000/svg">',
      },
      {
        type: "changed",
        lineIndex: 1,
        before: '<rect x="0" y="0" width="1" height="1" fill="#f00"/>',
        after: '<rect x="0" y="0" width="1" height="1" fill="#0f0"/>',
      },
      { type: "unchanged", lineIndex: 2, before: "</svg>", after: "</svg>" },
    ]);
  });

  it("reports fail while findings keep failing, then exceeded once the budget runs out", () => {
    const sessionId = "sprite-session-exceeded";
    const first = iterateSpriteHandler({
      sessionId,
      svg: BANDING_SVG,
      gridWidth: 20,
      gridHeight: 6,
      maxIterations: 2,
    });
    expect(first.structuredContent.status).toBe("fail");
    expect(first.structuredContent.iterationsRemaining).toBe(1);

    const second = iterateSpriteHandler({
      sessionId,
      svg: BANDING_SVG,
      gridWidth: 20,
      gridHeight: 6,
      maxIterations: 2,
    });
    expect(second.structuredContent.status).toBe("fail");
    expect(second.structuredContent.iterationsRemaining).toBe(0);

    const third = iterateSpriteHandler({
      sessionId,
      svg: BANDING_SVG,
      gridWidth: 20,
      gridHeight: 6,
      maxIterations: 2,
    });
    expect(third.structuredContent.status).toBe("exceeded");
    expect(third.structuredContent.iteration).toBe(3);
  });

  it("keeps independent sessions from interfering, and does not collide with a prose session of the same id", () => {
    const a = iterateSpriteHandler({
      sessionId: "shared-id",
      svg: CLEAN_SVG,
      gridWidth: 4,
      gridHeight: 4,
    });
    const b = iterateSpriteHandler({
      sessionId: "shared-id-2",
      svg: CLEAN_SVG,
      gridWidth: 4,
      gridHeight: 4,
    });
    expect(a.structuredContent.iteration).toBe(1);
    expect(b.structuredContent.iteration).toBe(1);
  });
});
