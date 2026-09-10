import { describe, expect, it } from "vitest";
import { gradeProsePatternHandler } from "../src/tools/grade-prose-pattern.js";

describe("gradeProsePatternHandler", () => {
  it("passes cleanly on clean input", async () => {
    const result = await gradeProsePatternHandler({
      text: "Marta: Real coin, or don't waste my time.",
    });
    expect(result.structuredContent.status).toBe("pass");
    expect(result.structuredContent.findings).toEqual([]);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe("text");
  });

  it("flags a seeded AI-tell phrase and reports fail severity", async () => {
    const result = await gradeProsePatternHandler({
      text: "Marta: In today's fast-paced world, no one pays what steel is worth.",
    });
    expect(result.structuredContent.status).toBe("fail");
    expect(result.structuredContent.findings.some((f) => f.ruleId === "in-todays-fast-paced-world")).toBe(
      true,
    );
  });

  it("returns valid JSON in the text content block matching structuredContent", async () => {
    const result = await gradeProsePatternHandler({ text: "Marta: Hello." });
    const textBlock = result.content[0];
    expect(textBlock?.type).toBe("text");
    if (textBlock?.type === "text") {
      expect(JSON.parse(textBlock.text)).toEqual(result.structuredContent);
    }
  });

  it("passes through custom options to the grader", async () => {
    const strict = await gradeProsePatternHandler({
      text: "Marta: The blacksmith refuses to lower her price for anyone.\nMarta: The blacksmith will not lower her price for anyone.",
      options: { redundancyThreshold: 0.1 },
    });
    expect(strict.structuredContent.findings.some((f) => f.ruleId === "adjacent-line-redundancy")).toBe(
      true,
    );
  });

  it("handles empty input without error", async () => {
    const result = await gradeProsePatternHandler({ text: "" });
    expect(result.structuredContent.status).toBe("pass");
    expect(result.structuredContent.summary["empty"]).toBe(true);
  });
});
