import { describe, expect, it } from "vitest";
import { toStringsTable } from "../../../src/prose/export/strings-table.js";
import { makeLine } from "../helpers.js";

describe("toStringsTable", () => {
  it("emits a key/value pair with the speaker as a trailing comment", () => {
    const output = toStringsTable([makeLine("Real coin, or nothing.", 3, "Marta")]);
    expect(output).toContain('"line_0003" = "Real coin, or nothing."; // Marta');
  });

  it("omits the trailing comment when there is no speaker", () => {
    const output = toStringsTable([makeLine("The door creaks shut.", 1)]);
    const entryLine = output.split("\n").find((line) => line.startsWith('"line_0001"'));
    expect(entryLine).toBe('"line_0001" = "The door creaks shut.";');
  });

  it("escapes double quotes and backslashes in the value", () => {
    const output = toStringsTable([makeLine('She said "stop" — \\ literally.', 1)]);
    expect(output).toContain('\\"stop\\"');
    expect(output).toContain("\\\\");
  });
});
