import { describe, expect, it } from "vitest";
import { splitSentences } from "../src/sentence-split.js";

describe("splitSentences", () => {
  it("returns an empty array for empty/whitespace-only input", () => {
    expect(splitSentences("")).toEqual([]);
    expect(splitSentences("   ")).toEqual([]);
  });

  it("returns a single sentence unsplit", () => {
    expect(splitSentences("Real coin, or don't waste my time.")).toEqual([
      "Real coin, or don't waste my time.",
    ]);
  });

  it("splits on a plain sentence boundary", () => {
    expect(splitSentences("Go on. Get.")).toEqual(["Go on.", "Get."]);
  });

  it("does not split on an abbreviation", () => {
    expect(splitSentences("Dr. Vance is waiting. He won't wait long.")).toEqual([
      "Dr. Vance is waiting.",
      "He won't wait long.",
    ]);
  });

  it("does not split mid-sentence on an ellipsis", () => {
    const result = splitSentences("Wait... What was that?");
    expect(result).toEqual(["Wait... What was that?"]);
  });

  it("does not split on a unicode ellipsis character", () => {
    const result = splitSentences("She hesitated… then nodded.");
    expect(result).toEqual(["She hesitated… then nodded."]);
  });

  it("splits after a closing quote following terminal punctuation", () => {
    const result = splitSentences('She said, "I\'m leaving." Then she walked out.');
    expect(result).toEqual(['She said, "I\'m leaving."', "Then she walked out."]);
  });

  it("drops a leading fragment that is pure punctuation", () => {
    expect(splitSentences("!!! Hello there.")).toEqual(["Hello there."]);
  });

  it("handles multiple abbreviations in one sentence", () => {
    const result = splitSentences("Dr. Vance met Prof. Reyes at 3 p.m. sharp.");
    expect(result).toEqual(["Dr. Vance met Prof. Reyes at 3 p.m. sharp."]);
  });
});
