import { describe, expect, it } from "vitest";
import { parseDialogueFile } from "../src/parse.js";

describe("parseDialogueFile", () => {
  it("returns an empty array for empty input", () => {
    expect(parseDialogueFile("")).toEqual([]);
  });

  it("drops blank lines but preserves original line numbers around them", () => {
    const lines = parseDialogueFile("Marta: Hello.\n\n\nPlayer: Hi.\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ sourceLine: 1, speaker: "Marta", text: "Hello." });
    expect(lines[1]).toMatchObject({ sourceLine: 4, speaker: "Player", text: "Hi." });
  });

  it("parses a speaker prefix", () => {
    const [line] = parseDialogueFile("Blacksmith: Real coin, or don't waste my time.");
    expect(line).toMatchObject({
      speaker: "Blacksmith",
      text: "Real coin, or don't waste my time.",
      raw: "Blacksmith: Real coin, or don't waste my time.",
    });
  });

  it("treats a line with no speaker prefix as plain prose", () => {
    const [line] = parseDialogueFile("The door creaks shut.");
    expect(line?.speaker).toBeUndefined();
    expect(line?.text).toBe("The door creaks shut.");
  });

  it("does not mistake a leading number/timestamp for a speaker", () => {
    const [line] = parseDialogueFile("3:00 the bell rings across the yard.");
    expect(line?.speaker).toBeUndefined();
    expect(line?.text).toBe("3:00 the bell rings across the yard.");
  });

  it("handles a multi-word speaker name with punctuation", () => {
    const [line] = parseDialogueFile("Old Man Yuudai: You again.");
    expect(line?.speaker).toBe("Old Man Yuudai");
    expect(line?.text).toBe("You again.");
  });

  it("preserves smart quotes and unicode content verbatim in text", () => {
    const [line] = parseDialogueFile('Marta: “You again,” she said.');
    expect(line?.text).toBe("“You again,” she said.");
  });

  it("handles CRLF and lone-CR line endings", () => {
    const lines = parseDialogueFile("A: one\r\nB: two\rC: three\n");
    expect(lines.map((l) => l.text)).toEqual(["one", "two", "three"]);
  });

  it("does not treat a colon with no following content as a speaker prefix", () => {
    const [line] = parseDialogueFile("Note:");
    expect(line?.speaker).toBeUndefined();
    expect(line?.text).toBe("Note:");
  });
});
