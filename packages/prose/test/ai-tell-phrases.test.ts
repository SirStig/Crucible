import { describe, expect, it } from "vitest";
import { detectAiTellPhrases } from "../src/detectors/ai-tell-phrases.js";
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
});
