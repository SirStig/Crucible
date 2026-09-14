import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BIN_PATH = fileURLToPath(new URL("../dist/bin.js", import.meta.url));

describe.skipIf(!existsSync(BIN_PATH))("crucible CLI binary (built)", () => {
  it("prints top-level help and exits 0", () => {
    const result = spawnSync(process.execPath, [BIN_PATH, "--help"], { encoding: "utf-8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("crucible");
    expect(result.stdout).toContain("prose");
    expect(result.stdout).toContain("visual");
  });

  it("prints visual grade help and exits 0", () => {
    const result = spawnSync(process.execPath, [BIN_PATH, "visual", "grade", "--help"], {
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--grid-width");
  });

  it("prints prose grade help and exits 0", () => {
    const result = spawnSync(process.execPath, [BIN_PATH, "prose", "grade", "--help"], {
      encoding: "utf-8",
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("--json");
  });

  it("exits non-zero on a missing required export option", () => {
    const result = spawnSync(process.execPath, [BIN_PATH, "prose", "export", "somefile.txt"], {
      encoding: "utf-8",
    });
    expect(result.status).not.toBe(0);
  });
});
