import { describe, expect, it } from "vitest";
import { detectVoiceVocabulary } from "../src/detectors/voice-vocabulary.js";
import { makeLines } from "./helpers.js";
import type { StyleProfileEntry } from "../src/data-loader.js";

const GRUFF: StyleProfileEntry = {
  id: "gruff-terse",
  displayName: "Marta the Blacksmith",
  register: "gruff, terse",
  vocabulary: { avoid: ["please", "delighted"] },
};

describe("detectVoiceVocabulary", () => {
  it("finds nothing when no profile is given", () => {
    expect(detectVoiceVocabulary(makeLines(["Please, take a seat."]), undefined)).toEqual([]);
  });

  it("finds nothing when the profile has no avoid list", () => {
    const profile: StyleProfileEntry = { id: "x", displayName: "X" };
    expect(detectVoiceVocabulary(makeLines(["Please, take a seat."]), profile)).toEqual([]);
  });

  it("flags a word the profile marks as not fitting the character's voice", () => {
    const findings = detectVoiceVocabulary(makeLines(["Please, take a seat."]), GRUFF);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ ruleId: "voice-vocabulary-mismatch", severity: "warn" });
    expect(findings[0]?.message).toContain("Marta the Blacksmith");
  });

  it("does not flag vocabulary the profile doesn't mention", () => {
    const findings = detectVoiceVocabulary(makeLines(["Get out of my forge."]), GRUFF);
    expect(findings).toEqual([]);
  });

  it("matches case-insensitively and reports the correct line", () => {
    const findings = detectVoiceVocabulary(makeLines(["Get out.", "PLEASE reconsider."]), GRUFF);
    expect(findings[0]?.location?.line).toBe(2);
  });
});
