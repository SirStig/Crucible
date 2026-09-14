import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runGradeCommand } from "../../src/cli/commands/grade.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crucible-grade-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function writeFixture(name: string, content: string): string {
  const path = join(dir, name);
  writeFileSync(path, content, "utf-8");
  return path;
}

describe("runGradeCommand", () => {
  it("returns exit code 0 and a human report for clean input", () => {
    const path = writeFixture("clean.txt", "Marta: Real coin, or don't waste my time.");
    const result = runGradeCommand(path, {});
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("PASS");
    expect(result.output).toContain("No issues found");
  });

  it("returns exit code 1 for a failing grade", () => {
    const path = writeFixture(
      "bad.txt",
      "Marta: In today's fast-paced world, no one pays what steel is worth.",
    );
    const result = runGradeCommand(path, {});
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain("FAIL");
    expect(result.output).toContain("in-todays-fast-paced-world");
  });

  it("emits valid JSON when --json is set", () => {
    const path = writeFixture("clean.txt", "Marta: Real coin, or don't waste my time.");
    const result = runGradeCommand(path, { json: true });
    const parsed = JSON.parse(result.output) as { status: string };
    expect(parsed.status).toBe("pass");
  });

  it("passes custom thresholds through to the grader", () => {
    const path = writeFixture(
      "redundant.txt",
      "Marta: The blacksmith refuses to lower her price for anyone.\nMarta: The blacksmith will not lower her price for anyone.",
    );
    const strict = runGradeCommand(path, { redundancyThreshold: 0.1 });
    expect(strict.output).toContain("adjacent-line-redundancy");

    const lenient = runGradeCommand(path, { redundancyThreshold: 0.99 });
    expect(lenient.output).not.toContain("adjacent-line-redundancy");
  });

  it("uses a custom phrases file override", () => {
    const customPhrases = writeFixture(
      "custom-phrases.json",
      JSON.stringify({
        version: "test",
        updated: "2026-01-01",
        phrases: [
          { id: "totally-custom", pattern: "zonk-a-doodle", type: "literal", severity: "fail" },
        ],
        templates: [],
      }),
    );
    const path = writeFixture("custom.txt", "Marta: That's a zonk-a-doodle deal.");
    const result = runGradeCommand(path, { phrasesFile: customPhrases });
    expect(result.output).toContain("totally-custom");
    expect(result.exitCode).toBe(1);
  });

  it("uses a style profile to flag out-of-voice vocabulary", () => {
    const profiles = writeFixture(
      "profiles.json",
      JSON.stringify({
        version: "test",
        updated: "2026-01-01",
        defaultProfile: "gruff",
        profiles: [
          {
            id: "gruff",
            displayName: "Marta",
            vocabulary: { avoid: ["please"] },
          },
        ],
      }),
    );
    const path = writeFixture("polite.txt", "Marta: Please, won't you reconsider?");
    const result = runGradeCommand(path, { styleProfilesFile: profiles });
    expect(result.output).toContain("voice-vocabulary-mismatch");
  });
});
