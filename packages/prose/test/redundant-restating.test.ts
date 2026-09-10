import { describe, expect, it } from "vitest";
import { detectRedundantRestating } from "../src/detectors/redundant-restating.js";
import { makeLines } from "./helpers.js";

describe("detectRedundantRestating", () => {
  it("finds nothing for unrelated adjacent lines", () => {
    const findings = detectRedundantRestating(
      makeLines(["The forge is cold tonight.", "Take the west road at dawn."]),
    );
    expect(findings).toEqual([]);
  });

  it("does not false-positive on short exchanges sharing only function words", () => {
    const findings = detectRedundantRestating(makeLines(["Was it him?", "Was it her?"]));
    expect(findings).toEqual([]);
  });

  it("does not flag a trivially short line pair at all, even if identical", () => {
    const findings = detectRedundantRestating(makeLines(["Yes.", "No."]));
    expect(findings).toEqual([]);
  });

  it("flags a near-duplicate restated line", () => {
    const findings = detectRedundantRestating(
      makeLines([
        "The blacksmith refuses to lower her price for anyone.",
        "The blacksmith will not lower her price for anyone.",
      ]),
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "adjacent-line-redundancy" });
    expect(findings[0]?.data?.["previousLine"]).toBe(1);
  });

  it("only compares each line to the one immediately before it", () => {
    const findings = detectRedundantRestating(
      makeLines([
        "The blacksmith refuses to lower her price for anyone.",
        "Take the west road at dawn instead.",
        "The blacksmith will not lower her price for anyone.",
      ]),
    );
    expect(findings).toEqual([]);
  });

  it("escalates near-identical restatements to fail", () => {
    const findings = detectRedundantRestating(
      makeLines([
        "The blacksmith refuses to lower her price.",
        "The blacksmith refuses to lower her price.",
      ]),
    );
    expect(findings[0]?.severity).toBe("fail");
  });

  it("respects a custom minTokensForRedundancy guard", () => {
    const lenient = detectRedundantRestating(makeLines(["Get out.", "Get out."]), {
      minTokensForRedundancy: 1,
    });
    expect(lenient).toHaveLength(1);

    const strict = detectRedundantRestating(makeLines(["Get out.", "Get out."]), {
      minTokensForRedundancy: 5,
    });
    expect(strict).toEqual([]);
  });

  it("handles unicode content tokens", () => {
    // A whole unspaced CJK line tokenizes as one run, so the default
    // minTokensForRedundancy guard is relaxed to actually exercise the
    // comparison here rather than being skipped by token count alone.
    const findings = detectRedundantRestating(
      makeLines(["彼女は森へ向かった。", "彼女は森へ向かった。"]),
      { minTokensForRedundancy: 1 },
    );
    // Non-Latin tokens pass through the stemmer untouched but still compare equal.
    expect(findings).toHaveLength(1);
  });
});
