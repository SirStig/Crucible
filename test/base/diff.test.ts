import { describe, expect, it } from "vitest";
import { diffLines } from "../../src/base/diff.js";

describe("diffLines", () => {
  it("returns an empty diff for two empty sequences", () => {
    expect(diffLines([], [])).toEqual([]);
  });

  it("reports every line unchanged when the sequences are identical", () => {
    const lines = ["a", "b", "c"];
    expect(diffLines(lines, lines)).toEqual([
      { type: "unchanged", lineIndex: 0, before: "a", after: "a" },
      { type: "unchanged", lineIndex: 1, before: "b", after: "b" },
      { type: "unchanged", lineIndex: 2, before: "c", after: "c" },
    ]);
  });

  it("reports a pure addition", () => {
    const result = diffLines(["a"], ["a", "b"]);
    expect(result).toEqual([
      { type: "unchanged", lineIndex: 0, before: "a", after: "a" },
      { type: "added", lineIndex: 1, after: "b" },
    ]);
  });

  it("reports a pure removal", () => {
    const result = diffLines(["a", "b"], ["a"]);
    expect(result).toEqual([
      { type: "unchanged", lineIndex: 0, before: "a", after: "a" },
      { type: "removed", lineIndex: 1, before: "b" },
    ]);
  });

  it("merges a one-line replacement into a single changed entry", () => {
    const result = diffLines(
      ["Marta: No.", "The door creaks shut."],
      ["Marta: Not a chance.", "The door creaks shut."],
    );
    expect(result).toEqual([
      { type: "changed", lineIndex: 0, before: "Marta: No.", after: "Marta: Not a chance." },
      {
        type: "unchanged",
        lineIndex: 1,
        before: "The door creaks shut.",
        after: "The door creaks shut.",
      },
    ]);
  });

  it("pairs a multi-line replacement and leaves the length mismatch as pure add/remove", () => {
    // Two lines replaced by three: two pair up as "changed", the extra is a pure "added".
    const result = diffLines(["x", "y"], ["p", "q", "r"]);
    expect(result).toEqual([
      { type: "changed", lineIndex: 0, before: "x", after: "p" },
      { type: "changed", lineIndex: 1, before: "y", after: "q" },
      { type: "added", lineIndex: 2, after: "r" },
    ]);
  });

  it("handles an entirely different sequence with no shared lines", () => {
    const result = diffLines(["a", "b"], ["c", "d"]);
    expect(result).toEqual([
      { type: "changed", lineIndex: 0, before: "a", after: "c" },
      { type: "changed", lineIndex: 1, before: "b", after: "d" },
    ]);
  });

  it("treats duplicate lines correctly across a diff", () => {
    const result = diffLines(["a", "a", "b"], ["a", "b", "a"]);
    // One valid LCS reading: keep both leading occurrences differently ordered around "b".
    expect(result.filter((d) => d.type === "unchanged")).not.toHaveLength(0);
    // Every original line should be accounted for in some form.
    const afterLines = result.filter((d) => d.after !== undefined).map((d) => d.after);
    expect(afterLines.sort()).toEqual(["a", "a", "b"].sort());
  });
});
