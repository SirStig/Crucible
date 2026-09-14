import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { resolveStyleProfile, applyStyleProfileToOptions } from "../../src/prose/style-profile.js";

const EXAMPLE_PROFILES = fileURLToPath(
  new URL("../../data/prose/example-style-profiles.json", import.meta.url),
);

describe("resolveStyleProfile", () => {
  it("resolves a profile by explicit id", () => {
    const profile = resolveStyleProfile(EXAMPLE_PROFILES, "formal-scribe");
    expect(profile?.displayName).toBe("Formal court scribe");
  });

  it("falls back to the file's defaultProfile when no id is given", () => {
    const profile = resolveStyleProfile(EXAMPLE_PROFILES);
    expect(profile?.id).toBe("gruff-terse");
  });

  it("returns undefined for an id that isn't in the file", () => {
    expect(resolveStyleProfile(EXAMPLE_PROFILES, "not-a-real-profile")).toBeUndefined();
  });

  it("throws a clear error for a missing file", () => {
    expect(() => resolveStyleProfile("/no/such/profiles.json", "x")).toThrow(
      /could not read data file/,
    );
  });
});

describe("applyStyleProfileToOptions", () => {
  it("merges a profile's rhythm overrides into empty options", () => {
    const profile = resolveStyleProfile(EXAMPLE_PROFILES, "gruff-terse");
    const merged = applyStyleProfileToOptions({}, profile);
    expect(merged.targetCv).toBe(0.25);
    expect(merged.minSentencesForRhythm).toBe(4);
  });

  it("does not override an explicitly set option", () => {
    const profile = resolveStyleProfile(EXAMPLE_PROFILES, "gruff-terse");
    const merged = applyStyleProfileToOptions({ targetCv: 0.9 }, profile);
    expect(merged.targetCv).toBe(0.9);
    // minSentencesForRhythm wasn't explicitly set, so the profile still fills it in.
    expect(merged.minSentencesForRhythm).toBe(4);
  });

  it("returns options unchanged when there is no profile", () => {
    const options = { targetCv: 0.5 };
    expect(applyStyleProfileToOptions(options, undefined)).toEqual(options);
  });
});
