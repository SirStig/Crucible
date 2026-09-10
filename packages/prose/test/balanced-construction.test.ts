import { describe, expect, it } from "vitest";
import { detectBalancedConstruction } from "../src/detectors/balanced-construction.js";
import { makeLines } from "./helpers.js";

describe("detectBalancedConstruction", () => {
  it("finds nothing when no template matches", () => {
    expect(detectBalancedConstruction(makeLines(["Real coin, or don't waste my time."]))).toEqual([]);
  });

  it("flags a single occurrence at the template's declared severity", () => {
    const findings = detectBalancedConstruction(
      makeLines(["This is not just a discount, it's an insult."]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "not-just-x-its-y", severity: "warn" });
  });

  it("escalates every match of a template to fail once it recurs at or past the threshold", () => {
    const findings = detectBalancedConstruction(
      makeLines([
        "This is not just a discount, it's an insult.",
        "This is not just charity, it's pride.",
      ]),
    );
    const matches = findings.filter((f) => f.ruleId === "not-just-x-its-y");
    expect(matches).toHaveLength(2);
    expect(matches.every((f) => f.severity === "fail")).toBe(true);
    expect(matches[0]?.data?.["occurrences"]).toBe(2);
  });

  it("tracks each template id independently", () => {
    const findings = detectBalancedConstruction(
      makeLines([
        "This is not just a discount, it's an insult.",
        "This isn't just about coin, it's about pride.",
      ]),
    );
    expect(findings.find((f) => f.ruleId === "not-just-x-its-y")?.severity).toBe("warn");
    expect(findings.find((f) => f.ruleId === "isnt-about-x-its-about-y")?.severity).toBe("warn");
  });
});
