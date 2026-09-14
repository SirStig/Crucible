import { describe, expect, it } from "vitest";
import { iterateProseHandler } from "../../src/mcp/tools/iterate-prose.js";

describe("iterateProseHandler", () => {
  it("starts a session at iteration 1 with an empty diff", () => {
    const result = iterateProseHandler({
      sessionId: "session-start",
      text: "Marta: Real coin, or don't waste my time.",
    });
    expect(result.structuredContent.iteration).toBe(1);
    expect(result.structuredContent.diff).toEqual([]);
    expect(result.structuredContent.status).toBe("pass");
  });

  it("diffs the second call against the first", () => {
    iterateProseHandler({ sessionId: "session-diff", text: "Marta: No.\nMarta: Fine." });
    const second = iterateProseHandler({
      sessionId: "session-diff",
      text: "Marta: Not a chance.\nMarta: Fine.",
    });
    expect(second.structuredContent.iteration).toBe(2);
    expect(second.structuredContent.diff).toEqual([
      { type: "changed", lineIndex: 0, before: "Marta: No.", after: "Marta: Not a chance." },
      { type: "unchanged", lineIndex: 1, before: "Marta: Fine.", after: "Marta: Fine." },
    ]);
  });

  it("reports fail while findings keep failing, then exceeded once the budget runs out", () => {
    const sessionId = "session-exceeded";
    const failingText = "Marta: In today's fast-paced world, prices are what they are.";

    const first = iterateProseHandler({ sessionId, text: failingText, maxIterations: 2 });
    expect(first.structuredContent.status).toBe("fail");
    expect(first.structuredContent.iterationsRemaining).toBe(1);

    const second = iterateProseHandler({ sessionId, text: failingText, maxIterations: 2 });
    expect(second.structuredContent.status).toBe("fail");
    expect(second.structuredContent.iterationsRemaining).toBe(0);

    const third = iterateProseHandler({ sessionId, text: failingText, maxIterations: 2 });
    expect(third.structuredContent.status).toBe("exceeded");
    expect(third.structuredContent.iteration).toBe(3);
  });

  it("ignores a maxIterations override on a call after the first for the same session", () => {
    const sessionId = "session-fixed-budget";
    iterateProseHandler({ sessionId, text: "Marta: Fine.", maxIterations: 1 });
    const second = iterateProseHandler({
      sessionId,
      text: "Marta: Still fine.",
      maxIterations: 10,
    });
    expect(second.structuredContent.status).toBe("exceeded");
  });

  it("keeps independent sessions from interfering with each other", () => {
    const a = iterateProseHandler({ sessionId: "session-a", text: "A: one" });
    const b = iterateProseHandler({ sessionId: "session-b", text: "B: one" });
    expect(a.structuredContent.iteration).toBe(1);
    expect(b.structuredContent.iteration).toBe(1);
  });

  it("folds Tier 2 craftFindings into this iteration's grade and status", () => {
    const clean = iterateProseHandler({ sessionId: "session-craft-pass", text: "Marta: Fine." });
    expect(clean.structuredContent.status).toBe("pass");
    expect(clean.structuredContent.grade.findings).toEqual([]);

    const withCraft = iterateProseHandler({
      sessionId: "session-craft-fail",
      text: "Marta: Fine.",
      craftFindings: [
        {
          id: "prose.craft-rubric",
          ruleId: "self-justifying-explanation",
          severity: "fail",
          message:
            "Self-justifying / over-explaining: explains itself instead of stating the fact.",
          fixHint: "Cut the justification clause.",
        },
      ],
    });
    expect(withCraft.structuredContent.status).toBe("fail");
    expect(withCraft.structuredContent.grade.findings).toHaveLength(1);
    expect(withCraft.structuredContent.grade.findings[0]?.ruleId).toBe(
      "self-justifying-explanation",
    );
  });

  it("does not force a fail from craftFindings that are all pass-level (no findings supplied)", () => {
    const result = iterateProseHandler({
      sessionId: "session-craft-empty",
      text: "Marta: Fine.",
      craftFindings: [],
    });
    expect(result.structuredContent.status).toBe("pass");
  });
});
