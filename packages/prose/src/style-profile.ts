import type { GradeOptions } from "./types.js";
import { loadStyleProfileData, type StyleProfileEntry } from "./data-loader.js";

/**
 * FR18: resolves one named profile from a project's own style-profile file.
 * `profileId` omitted falls back to the file's own `defaultProfile`; if
 * neither is set, returns undefined rather than guessing.
 */
export function resolveStyleProfile(
  profilesFile: string,
  profileId?: string,
): StyleProfileEntry | undefined {
  const data = loadStyleProfileData(profilesFile);
  const targetId = profileId ?? data.defaultProfile;
  if (targetId === undefined) return undefined;
  return data.profiles.find((profile) => profile.id === targetId);
}

/**
 * Merges a profile's rhythm overrides into grading options. Explicit
 * options always win — a profile sets a *default* target for a character's
 * voice, not a hard override of something the caller already specified.
 */
export function applyStyleProfileToOptions(
  options: GradeOptions,
  profile: StyleProfileEntry | undefined,
): GradeOptions {
  const overrides = profile?.rhythmOverrides;
  if (!overrides) return options;

  const merged: GradeOptions = { ...options };
  if (merged.targetCv === undefined && overrides.targetCv !== undefined) {
    merged.targetCv = overrides.targetCv;
  }
  if (merged.minSentencesForRhythm === undefined && overrides.minSentencesForRhythm !== undefined) {
    merged.minSentencesForRhythm = overrides.minSentencesForRhythm;
  }
  return merged;
}
