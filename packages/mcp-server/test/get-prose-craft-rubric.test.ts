import { describe, expect, it } from "vitest";
import { getProseCraftRubricHandler } from "../src/tools/get-prose-craft-rubric.js";

describe("getProseCraftRubricHandler", () => {
  it("returns every rubric item when no ruleId is given", () => {
    const result = getProseCraftRubricHandler({});
    expect(result.structuredContent.rubric.length).toBeGreaterThanOrEqual(3);
    expect(result.structuredContent.rubric.map((r) => r.id)).toContain(
      "self-justifying-explanation",
    );
  });

  it("returns exactly one item when a valid ruleId is given", () => {
    const result = getProseCraftRubricHandler({ ruleId: "self-justifying-explanation" });
    expect(result.structuredContent.rubric).toHaveLength(1);
    expect(result.structuredContent.rubric[0]).toMatchObject({
      id: "self-justifying-explanation",
      name: "Self-justifying / over-explaining",
    });
    expect(result.structuredContent.rubric[0]?.fixHint).toBeTruthy();
  });

  it("throws a clear error for an unknown ruleId", () => {
    expect(() => getProseCraftRubricHandler({ ruleId: "not-a-real-rule" })).toThrow(
      /no Tier 2 rubric item named "not-a-real-rule"/,
    );
  });

  it("includes on-the-nose-dialogue and exposition-dump", () => {
    const result = getProseCraftRubricHandler({});
    const ids = result.structuredContent.rubric.map((r) => r.id);
    expect(ids).toContain("on-the-nose-dialogue");
    expect(ids).toContain("exposition-dump");
  });
});
