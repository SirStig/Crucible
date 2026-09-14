import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVisualFoliageCommand } from "../../src/cli/commands/visual-foliage.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crucible-visual-foliage-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("runVisualFoliageCommand", () => {
  it("writes a well-formed SVG for a named preset", () => {
    const outPath = join(dir, "fern.svg");
    runVisualFoliageCommand({ preset: "fern", out: outPath });
    const svg = readFileSync(outPath, "utf-8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("applies iteration/angle/step overrides", () => {
    const outPath = join(dir, "weed.svg");
    runVisualFoliageCommand({ preset: "weed", out: outPath, iterations: 1 });
    const overridden = readFileSync(outPath, "utf-8");

    const basePath = join(dir, "weed-base.svg");
    runVisualFoliageCommand({ preset: "weed", out: basePath });
    const base = readFileSync(basePath, "utf-8");

    expect(overridden).not.toBe(base);
  });

  it("throws a clear error for an unknown preset", () => {
    expect(() => runVisualFoliageCommand({ preset: "not-real", out: join(dir, "x.svg") })).toThrow(
      /unknown foliage preset/,
    );
  });
});
