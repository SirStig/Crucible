import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVisualRenderCommand } from "../src/commands/visual-render.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crucible-visual-render-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("runVisualRenderCommand", () => {
  it("renders an SVG file to a PNG at the declared grid size", () => {
    const svgPath = join(dir, "sprite.svg");
    writeFileSync(
      svgPath,
      `<svg xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="1" height="1" fill="#f00"/></svg>`,
      "utf-8",
    );
    const outPath = join(dir, "out.png");

    runVisualRenderCommand(svgPath, { gridWidth: 4, gridHeight: 4, out: outPath });

    const png = readFileSync(outPath);
    expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  });
});
