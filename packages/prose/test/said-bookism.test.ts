import { describe, expect, it } from "vitest";
import { detectSaidBookisms } from "../src/detectors/said-bookism.js";
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
});
