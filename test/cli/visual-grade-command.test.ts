import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runVisualGradeCommand } from "../../src/cli/commands/visual-grade.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crucible-visual-grade-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeSvg(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("runVisualGradeCommand", () => {
  it("returns exit code 0 and a human report for a clean sprite", () => {
    const path = writeSvg(
      "clean.svg",
      `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="2" height="2" fill="#00f"/></svg>`,
    );
    const result = runVisualGradeCommand(path, { gridWidth: 4, gridHeight: 4 });
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("PASS");
    expect(result.output).toContain("No issues found");
  });

  it("returns exit code 1 for a sprite with a seeded banding issue", () => {
    const path = writeSvg(
      "shading-strips.svg",
      `<svg xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="20" height="3" fill="#cc4444"/>
        <rect x="0" y="3" width="20" height="3" fill="#882222"/>
      </svg>`,
    );
    const result = runVisualGradeCommand(path, { gridWidth: 20, gridHeight: 6 });
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("FAIL");
    expect(result.output).toContain("Break the parallel run");
  });

  it("emits valid JSON when --json is set", () => {
    const path = writeSvg(
      "clean.svg",
      `<svg xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="1" height="1" fill="#0f0"/></svg>`,
    );
    const result = runVisualGradeCommand(path, { gridWidth: 4, gridHeight: 4, json: true });
    const parsed = JSON.parse(result.output) as { status: string };
    expect(parsed.status).toBe("pass");
  });

  it("passes custom thresholds through to the grader", () => {
    // Named to avoid the filename itself containing the substring "banding",
    // the report header echoes the file path, which would defeat the assertion below.
    const path = writeSvg(
      "shading-strips.svg",
      `<svg xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="20" height="3" fill="#cc4444"/>
        <rect x="0" y="3" width="20" height="3" fill="#882222"/>
      </svg>`,
    );
    const strict = runVisualGradeCommand(path, {
      gridWidth: 20,
      gridHeight: 6,
      bandingElongationThreshold: 1000,
    });
    expect(strict.output).not.toContain("banding");
  });

  it("flags an unattached fragment by default and clears it with a stricter maxAttachmentGap", () => {
    const path = writeSvg(
      "post-with-gap.svg",
      `<svg xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="6" height="6" fill="#4488cc"/>
        <rect x="8" y="0" width="1" height="1" fill="#4488cc"/>
      </svg>`,
    );
    const withGap = runVisualGradeCommand(path, { gridWidth: 20, gridHeight: 20 });
    expect(withGap.output).toContain("unattached-fragment");

    const strict = runVisualGradeCommand(path, {
      gridWidth: 20,
      gridHeight: 20,
      maxAttachmentGap: 1,
    });
    expect(strict.output).not.toContain("unattached-fragment");
  });
});
