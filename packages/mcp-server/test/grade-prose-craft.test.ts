import { describe, expect, it } from "vitest";
import { gradeProseCraftHandler } from "../src/tools/grade-prose-craft.js";

describe("gradeProseCraftHandler", () => {
  it("returns no finding for a pass verdict", () => {
    const result = gradeProseCraftHandler({
      ruleId: "self-justifying-explanation",
      text: "Buy someone a coffee.",
      verdict: "pass",
      reasoning: "States the fact plainly with no justification clause.",
    });
    expect(result.structuredContent.verdict).toBe("pass");
    expect(result.structuredContent.finding).toBeUndefined();
  });

  it("structures a fail verdict into a Finding using the rubric's own fixHint", () => {
    const result = gradeProseCraftHandler({
      ruleId: "self-justifying-explanation",
      text: 'Named for coffee on purpose — there is no way to write "a cup of coffee" that could pass for an in-game reward.',
      verdict: "fail",
      reasoning: "Explains why it's called coffee instead of just naming the tier.",
    });
    expect(result.structuredContent.verdict).toBe("fail");
    expect(result.structuredContent.finding).toMatchObject({
      id: "prose.craft-rubric",
      ruleId: "self-justifying-explanation",
      severity: "fail",
    });
    expect(result.structuredContent.finding?.fixHint).toContain("Cut the justification");
    expect(result.structuredContent.finding?.message).toContain(
      "Self-justifying / over-explaining",
    );
  });

  it("includes the line number in the finding location when provided", () => {
    const result = gradeProseCraftHandler({
      ruleId: "on-the-nose-dialogue",
      text: "I'm angry because you betrayed me.",
      verdict: "warn",
      reasoning: "States the emotion directly instead of through subtext.",
      line: 4,
    });
    expect(result.structuredContent.finding?.location).toMatchObject({ line: 4 });
  });

  it("throws a clear error for an unknown ruleId", () => {
    expect(() =>
      gradeProseCraftHandler({
        ruleId: "not-a-real-rule",
        text: "hello",
        verdict: "pass",
        reasoning: "n/a",
      }),
    ).toThrow(/no Tier 2 rubric item named "not-a-real-rule"/);
  });
});
