import { describe, expect, it } from "vitest";
import { detectAiTellPhrases } from "../../src/prose/detectors/ai-tell-phrases.js";
import { makeLine, makeLines } from "./helpers.js";

describe("detectAiTellPhrases", () => {
  it("finds nothing in plain, specific dialogue", () => {
    const findings = detectAiTellPhrases(makeLines(["Real coin, or don't waste my time."]));
    expect(findings).toEqual([]);
  });

  it("flags a regex-pattern entry (delve into)", () => {
    const findings = detectAiTellPhrases(makeLines(["The scholar delves into forbidden texts."]));
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "delve-into", severity: "warn" });
  });

  it("flags a literal-word-boundary entry without false-positiving on a substring", () => {
    const hit = detectAiTellPhrases(makeLines(["Moreover, the treaty stands."]));
    expect(hit.some((f) => f.ruleId === "moreover")).toBe(true);

    const noHit = detectAiTellPhrases(makeLines(["The seas moved on, evermore restless."]));
    expect(noHit.some((f) => f.ruleId === "moreover")).toBe(false);
  });

  it("flags the near-canonical opener at fail severity, including the society variant", () => {
    const findings = detectAiTellPhrases(
      makeLines(["In today's fast-paced society, nobody has time to haggle."]),
    );
    const finding = findings.find((f) => f.ruleId === "in-todays-fast-paced-world");
    expect(finding?.severity).toBe("fail");
  });

  it("reports a correct line number and excerpt", () => {
    const line = makeLine("The market boasts a fine selection.", 7);
    const findings = detectAiTellPhrases([line]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.location?.line).toBe(7);
    expect(findings[0]?.location?.excerpt).toContain("boasts");
  });

  it("reports one finding per occurrence when a phrase repeats on the same line", () => {
    const findings = detectAiTellPhrases(
      makeLines(["Moreover, and moreover still, the debt remains."]),
    );
    expect(findings.filter((f) => f.ruleId === "moreover")).toHaveLength(2);
  });

  it("throws a clear error when pointed at a missing custom data file", () => {
    expect(() => detectAiTellPhrases(makeLines(["hello"]), "/no/such/file.json")).toThrow(
      /could not read data file/,
    );
  });

  it("flags new Wikipedia-sourced overused words at their documented severity", () => {
    const findings = detectAiTellPhrases(
      makeLines([
        "The blade's intricate engravings garnered every collector's attention.",
        "Her meticulous notes bolstered the guild's case.",
      ]),
    );
    expect(findings.map((f) => f.ruleId).sort()).toEqual(
      ["bolstered", "garner", "intricate", "meticulous"].sort(),
    );
  });

  it("keeps domain-risky bare words at low severity rather than banning them outright", () => {
    const findings = detectAiTellPhrases(
      makeLines(["This armor is remarkably robust and quite valuable across the landscape."]),
    );
    // "robust", "valuable", and "landscape" are excluded entirely;
    // none of them should fire even though they're on Wikipedia's own list.
    expect(findings).toEqual([]);
  });
});
