import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { getStyleProfileHandler } from "../../src/mcp/tools/get-style-profile.js";

const EXAMPLE_PROFILES = fileURLToPath(
  new URL("../../data/prose/example-style-profiles.json", import.meta.url),
);

describe("getStyleProfileHandler", () => {
  it("returns every profile and the file's defaultProfile when no profileId is given", () => {
    const result = getStyleProfileHandler({ profilesFile: EXAMPLE_PROFILES });
    expect(result.structuredContent.profiles.length).toBeGreaterThanOrEqual(2);
    expect(result.structuredContent.defaultProfile).toBe("gruff-terse");
  });

  it("returns exactly one profile when profileId is given", () => {
    const result = getStyleProfileHandler({
      profilesFile: EXAMPLE_PROFILES,
      profileId: "formal-scribe",
    });
    expect(result.structuredContent.profiles).toHaveLength(1);
    expect(result.structuredContent.profiles[0]?.displayName).toBe("Formal court scribe");
  });

  it("throws a clear error for an unknown profileId", () => {
    expect(() =>
      getStyleProfileHandler({ profilesFile: EXAMPLE_PROFILES, profileId: "nope" }),
    ).toThrow(/no style profile named "nope"/);
  });
});
