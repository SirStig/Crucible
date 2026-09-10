import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runExportCommand } from "../src/commands/export.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "canvasloop-export-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeFixture(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("runExportCommand", () => {
  const input = "Marta: Real coin, or don't waste my time.\nThe door creaks shut.";

  it("writes and returns ink output", () => {
    const inPath = writeFixture("scene.txt", input);
    const outPath = join(dir, "out.ink");
    const returned = runExportCommand(inPath, { format: "ink", out: outPath });
    const written = readFileSync(outPath, "utf-8");
    expect(written).toBe(returned);
    expect(written).toContain("Marta: Real coin, or don't waste my time. # speaker:Marta");
  });

  it("writes yarn output with a custom node title", () => {
    const inPath = writeFixture("scene.txt", input);
    const outPath = join(dir, "out.yarn");
    runExportCommand(inPath, { format: "yarn", out: outPath, node: "BlacksmithReject" });
    const written = readFileSync(outPath, "utf-8");
    expect(written).toContain("title: BlacksmithReject");
  });

  it("writes json table output", () => {
    const inPath = writeFixture("scene.txt", input);
    const outPath = join(dir, "out.json");
    runExportCommand(inPath, { format: "json", out: outPath });
    const parsed = JSON.parse(readFileSync(outPath, "utf-8")) as { entries: unknown[] };
    expect(parsed.entries).toHaveLength(2);
  });

  it("writes strings-table output", () => {
    const inPath = writeFixture("scene.txt", input);
    const outPath = join(dir, "out.strings");
    runExportCommand(inPath, { format: "strings", out: outPath });
    const written = readFileSync(outPath, "utf-8");
    expect(written).toContain('"line_0001" = "Real coin, or don\'t waste my time."; // Marta');
    expect(written).toContain('"line_0002" = "The door creaks shut.";');
  });
});
