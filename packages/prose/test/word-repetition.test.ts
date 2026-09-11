import { describe, expect, it } from "vitest";
import { detectWordRepetition } from "../src/detectors/word-repetition.js";
import { makeLines } from "./helpers.js";

// Modeled directly on the real "Support the game" screen that motivated this
// check: "nothing" recurs across six of the thirteen messages.
const SUPPORT_SCREEN = [
  "Nothing that helps you. No coin, no heroes, no gear.",
  "A lit gold seal on your title screen. Nothing else in the game changes.",
  "Named for coffee on purpose, give whenever you like, or never.",
  "One cup, for the person who made this.",
  "Enough for an evening of it.",
  "Generous, and it still buys you plenty.",
  "So there is nothing left for the App Store to hand back later.",
  "Thank you. Nothing else about the game moved.",
  "Thank you, genuinely. Nothing in the game has changed, which was the deal.",
  "Restored. Thank you again.",
  "That purchase could not be verified, so nothing was recorded and nothing about your game has changed.",
  "Waiting for approval. It will arrive on its own if it is approved.",
  "Close.",
];

describe("detectWordRepetition", () => {
  it("skips entirely below the minimum line count", () => {
    const findings = detectWordRepetition(makeLines(["Nothing here.", "Nothing there."]));
    expect(findings).toEqual([]);
  });

  it("does not flag ordinary vocabulary spread thinly across a document", () => {
    const findings = detectWordRepetition(
      makeLines([
        "The forge is cold tonight.",
        "Take the west road at dawn.",
        "Wolves have been seen near the mill.",
        "The guild posted a new bounty.",
        "Rain is coming in from the coast.",
        "The market closes at dusk.",
      ]),
    );
    expect(findings).toEqual([]);
  });

  it("flags a word that recurs across many separate lines as a tic", () => {
    const findings = detectWordRepetition(makeLines(SUPPORT_SCREEN));
    const nothing = findings.find(
      (f) => f.ruleId === "repeated-word-overuse" && f.data?.["word"] === "nothing",
    );
    expect(nothing).toBeDefined();
    expect(nothing?.data).toMatchObject({ lineCount: 6, totalLines: 13 });
    expect(nothing?.severity).toBe("fail");
  });

  it("counts a word once per line even if it appears twice in that line", () => {
    const findings = detectWordRepetition(
      makeLines([
        "Nothing changes, nothing at all changes here.",
        "Take the road at dawn.",
        "Wolves near the mill tonight.",
        "The guild posted a bounty.",
        "Rain from the coast today.",
        "The market closes at dusk.",
      ]),
    );
    // A single line's worth of repetition (however many times "nothing"
    // appears within that one line) doesn't clear minOccurrenceLines (4).
    const nothing = findings.find((f) => f.data?.["word"] === "nothing");
    expect(nothing).toBeUndefined();
  });

  it("respects custom thresholds", () => {
    const lines = makeLines([
      "Wolves near the mill.",
      "Wolves on the road.",
      "No wolves reported today.",
      "The guild posted a bounty.",
      "Rain from the coast.",
      "The market closes at dusk.",
    ]);
    const lenient = detectWordRepetition(lines, {
      minOccurrenceLines: 2,
      repetitionLineRatio: 0.1,
    });
    expect(lenient.some((f) => f.data?.["word"] === "wolf" || f.data?.["word"] === "wolves")).toBe(
      true,
    );

    const strict = detectWordRepetition(lines, { minOccurrenceLines: 10 });
    expect(strict).toEqual([]);
  });
});
