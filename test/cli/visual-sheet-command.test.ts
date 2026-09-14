import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVisualSheetCommand } from "../../src/cli/commands/visual-sheet.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crucible-visual-sheet-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeFrame(name: string, color: string): void {
  writeFileSync(
    join(dir, name),
    `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="4" height="4" fill="${color}"/></svg>`,
    "utf-8",
  );
}

describe("runVisualSheetCommand", () => {
  it("packs frames listed in a manifest, resolving paths relative to the manifest", () => {
    writeFrame("a.svg", "#f00");
    writeFrame("b.svg", "#0f0");
    const manifestPath = join(dir, "manifest.json");
    writeFileSync(
      manifestPath,
      JSON.stringify([
        { file: "a.svg", gridWidth: 4, gridHeight: 4, name: "a" },
        { file: "b.svg", gridWidth: 4, gridHeight: 4, name: "b" },
      ]),
      "utf-8",
    );
    const outPath = join(dir, "sheet.png");

    runVisualSheetCommand(manifestPath, { out: outPath, columns: 2 });

    const png = readFileSync(outPath);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });

  it("throws a clear error for invalid manifest JSON", () => {
    const manifestPath = join(dir, "bad.json");
    writeFileSync(manifestPath, "not json", "utf-8");
    expect(() =>
      runVisualSheetCommand(manifestPath, { out: join(dir, "out.png"), columns: 1 }),
    ).toThrow(/not valid JSON/);
  });
});
