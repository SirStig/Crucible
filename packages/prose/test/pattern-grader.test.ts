import { describe, expect, it } from "vitest";
import { gradeProsePattern } from "../src/pattern-grader.js";
import { parseDialogueFile } from "../src/parse.js";
import { MESSY_SCENE, CLEAN_SCENE } from "./fixtures/sample-scene.js";

describe("gradeProsePattern", () => {
  it("passes cleanly on empty input", () => {
    const result = gradeProsePattern([]);
    expect(result.status).toBe("pass");
    expect(result.findings).toEqual([]);
    expect(result.summary.empty).toBe(true);
    expect(result.summary.rhythmSkipped).toBe(true);
    expect(result.summary.saidBookismApplicable).toBe(false);
  });

  it("passes cleanly on input that parses to zero lines (all blank)", () => {
    const result = gradeProsePattern(parseDialogueFile("\n\n   \n\t\n"));
    expect(result.status).toBe("pass");
    expect(result.summary.empty).toBe(true);
  });

  it("flags nothing on a clean, hand-fixed scene", () => {
    const lines = parseDialogueFile(CLEAN_SCENE);
    const result = gradeProsePattern(lines);
    expect(result.status).toBe("pass");
    expect(result.findings).toEqual([]);
    expect(result.summary.empty).toBe(false);
    expect(result.summary.lineCount).toBe(lines.length);
  });

  it("surfaces every seeded issue category on the messy scene", () => {
    const lines = parseDialogueFile(MESSY_SCENE);
    const result = gradeProsePattern(lines);

    expect(result.status).toBe("fail");
    expect(result.summary.lineCount).toBe(lines.length);
    expect(result.summary.empty).toBe(false);
    expect(result.summary.saidBookismApplicable).toBe(true);

    const ruleIds = result.findings.map((f) => f.ruleId);
    expect(ruleIds).toContain("in-todays-fast-paced-world");
    expect(ruleIds).toContain("exclaim");
    expect(ruleIds).toContain("not-just-x-its-y");
    expect(ruleIds).toContain("isnt-about-x-its-about-y");

    const fastPacedFinding = result.findings.find((f) => f.ruleId === "in-todays-fast-paced-world");
    expect(fastPacedFinding?.severity).toBe("fail");
    expect(fastPacedFinding?.location?.line).toBe(1);
  });

  it("respects a custom redundancy threshold passed through options", () => {
    const lines = parseDialogueFile(
      "Marta: The forge is cold tonight, colder than it's been in years.\nMarta: Tonight the forge is cold, colder than it has been in years.",
    );
    const lenient = gradeProsePattern(lines, { redundancyThreshold: 0.99 });
    const strict = gradeProsePattern(lines, { redundancyThreshold: 0.1 });
    expect(lenient.findings.some((f) => f.ruleId === "adjacent-line-redundancy")).toBe(false);
    expect(strict.findings.some((f) => f.ruleId === "adjacent-line-redundancy")).toBe(true);
  });
});
