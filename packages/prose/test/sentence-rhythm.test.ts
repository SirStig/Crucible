import { describe, expect, it } from "vitest";
import { detectSentenceRhythm } from "../src/detectors/sentence-rhythm.js";
import { makeLines } from "./helpers.js";

describe("detectSentenceRhythm", () => {
  it("skips entirely when there are too few sentences to judge", () => {
    const result = detectSentenceRhythm(makeLines(["Go. Go now."]));
    expect(result.skipped).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("does not flag naturally varied sentence lengths", () => {
    const result = detectSentenceRhythm(
      makeLines([
        "Go.",
        "Go now, before the guards notice you're gone.",
        "Wait.",
        "The road forks south of the old mill, past the burned-out barn.",
        "Run.",
      ]),
    );
    expect(result.skipped).toBe(false);
    expect(result.findings).toEqual([]);
  });

  it("flags near-identical sentence lengths as a fail", () => {
    const result = detectSentenceRhythm(
      makeLines([
        "The merchant walked slowly through the crowded market square today.",
        "The soldier stood quietly beside the weathered stone city gate.",
        "The traveler sat calmly beneath the ancient oak tree outside.",
        "The blacksmith worked steadily beside the roaring forge fire.",
      ]),
    );
    expect(result.skipped).toBe(false);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.severity).toBe("fail");
    expect(result.findings[0]?.ruleId).toBe("uniform-sentence-rhythm");
  });

  it("flags moderately uniform sentence lengths as a warn, not a fail", () => {
    const result = detectSentenceRhythm(
      makeLines([
        "Go now, before they see you.",
        "The gate is shut, and the guards are watching closely.",
        "Wait quietly here until the signal comes.",
        "The old mill stands past the burned barn down the road.",
      ]),
    );
    expect(result.skipped).toBe(false);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.severity).toBe("warn");
  });

  it("honors a custom minSentencesForRhythm and targetCv", () => {
    const skipped = detectSentenceRhythm(makeLines(["One. Two. Three."]), {
      minSentencesForRhythm: 10,
    });
    expect(skipped.skipped).toBe(true);

    const lenient = detectSentenceRhythm(
      makeLines([
        "The merchant walked slowly through the crowded market square today.",
        "The soldier stood quietly beside the weathered stone city gate.",
        "The traveler sat calmly beneath the ancient oak tree outside.",
        "The blacksmith worked steadily beside the roaring forge fire.",
      ]),
      { targetCv: 0 },
    );
    expect(lenient.findings).toEqual([]);
  });
});
