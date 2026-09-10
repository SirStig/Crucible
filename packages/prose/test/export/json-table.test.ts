import { describe, expect, it } from "vitest";
import { toJsonTable, lineKey } from "../../src/export/json-table.js";
import { makeLine } from "../helpers.js";

describe("toJsonTable", () => {
  it("produces deterministic, zero-padded keys from the source line number", () => {
    expect(lineKey(1)).toBe("line_0001");
    expect(lineKey(42)).toBe("line_0042");
  });

  it("emits valid JSON with the expected envelope and entries", () => {
    const output = toJsonTable([
      makeLine("Real coin, or don't waste my time.", 3, "Marta"),
      makeLine("The door creaks shut.", 5),
    ]);
    const parsed = JSON.parse(output) as {
      format: string;
      version: number;
      entries: Array<{ key: string; speaker: string | null; text: string }>;
    };
    expect(parsed.format).toBe("canvasloop-strings");
    expect(parsed.version).toBe(1);
    expect(parsed.entries).toEqual([
      { key: "line_0003", speaker: "Marta", text: "Real coin, or don't waste my time." },
      { key: "line_0005", speaker: null, text: "The door creaks shut." },
    ]);
  });

  it("ends with a trailing newline", () => {
    const output = toJsonTable([makeLine("Hi.", 1)]);
    expect(output.endsWith("\n")).toBe(true);
  });
});
