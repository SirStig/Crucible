import { describe, expect, it } from "vitest";
import { detectSaidBookisms } from "../../src/prose/detectors/said-bookism.js";
import { makeLine, makeLines } from "./helpers.js";

describe("detectSaidBookisms", () => {
  it("is a documented no-op when the input has no quoted spans", () => {
    const result = detectSaidBookisms(makeLines(["The door creaks shut behind them."]));
    expect(result.applicable).toBe(false);
    expect(result.findings).toEqual([]);
  });

  it("does not flag a plain 'said' tag", () => {
    const result = detectSaidBookisms(makeLines(['"Real coin, or nothing," she said.']));
    expect(result.applicable).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it("flags a bookism when the tag comes after the quote", () => {
    const result = detectSaidBookisms(
      makeLines(['"That\'s an insult, not an offer," she exclaimed.']),
    );
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ ruleId: "exclaim", severity: "warn" });
  });

  it("flags a bookism when the tag comes before the quote", () => {
    const result = detectSaidBookisms(makeLines(['Marta declared, "Get out of my forge."']));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toMatchObject({ ruleId: "declare" });
  });

  it("flags a physically-impossible dialogue tag at fail severity", () => {
    const result = detectSaidBookisms(makeLines(['"You again," she smiled.']));
    expect(result.findings[0]).toMatchObject({ ruleId: "smile", severity: "fail" });
  });

  it("handles smart quotes via internal normalization", () => {
    const result = detectSaidBookisms(makeLines(["“Get out,” she asserted."]));
    expect(result.applicable).toBe(true);
    expect(result.findings[0]).toMatchObject({ ruleId: "assert" });
  });

  it("matches verb forms case-insensitively", () => {
    const result = detectSaidBookisms(makeLines(['"Enough," EXCLAIMED the old man.']));
    expect(result.findings[0]).toMatchObject({ ruleId: "exclaim" });
  });

  it("does not reach across a line boundary for context", () => {
    const first = makeLine('Marta said, "Get out."', 1);
    const second = makeLine("She exclaimed nothing else that day.", 2);
    const result = detectSaidBookisms([first, second]);
    expect(result.findings).toEqual([]);
  });

  it("reports a correct line number", () => {
    const line = makeLine('"Enough," she exclaimed.', 12);
    const result = detectSaidBookisms([line]);
    expect(result.findings[0]?.location?.line).toBe(12);
  });

  it("flags the Lexicon's own named bookism examples: retort and inquire", () => {
    const retort = detectSaidBookisms(makeLines(['"Not a chance," she retorted.']));
    expect(retort.findings[0]).toMatchObject({ ruleId: "retort" });

    const inquire = detectSaidBookisms(makeLines(['"Is that so?" he inquired.']));
    expect(inquire.findings[0]).toMatchObject({ ruleId: "inquire" });
  });

  it("flags a Tom Swifty: a plain said/asked/replied paired with a manner adverb", () => {
    const after = detectSaidBookisms(makeLines(['"Get out," she said icily.']));
    expect(after.findings).toHaveLength(1);
    expect(after.findings[0]).toMatchObject({ ruleId: "tom-swifty", severity: "info" });
    expect(after.findings[0]?.data).toMatchObject({ matchedVerb: "said", matchedAdverb: "icily" });

    const before = detectSaidBookisms(makeLines(['She asked warily, "Who sent you?"']));
    expect(before.findings[0]).toMatchObject({ ruleId: "tom-swifty" });
  });

  it("does not flag a Tom Swifty for an ordinary -ly word that isn't a manner adverb", () => {
    const result = detectSaidBookisms(makeLines(['"Fine," she said only.']));
    expect(result.findings).toEqual([]);
  });

  it("does not flag a Tom Swifty when a real bookism already matched the same quote", () => {
    // "exclaimed icily" would trip both checks if they weren't mutually
    // exclusive by construction (bookism check runs first, per-quote).
    const result = detectSaidBookisms(makeLines(['"Get out," she exclaimed icily.']));
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.ruleId).toBe("exclaim");
  });
});
