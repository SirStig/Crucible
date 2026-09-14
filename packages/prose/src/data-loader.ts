import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Severity } from "canvasloop-core";

const severitySchema: z.ZodType<Severity> = z.enum(["info", "warn", "fail"]);

// A named source this entry's inclusion is grounded in: a citation, not
// free-form commentary. Keep `note` for the entry-specific rationale (why
// *this* pattern, why this severity) and `source` for where the underlying
// claim comes from.
const sourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1).optional(),
});

const phraseEntrySchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  type: z.enum(["literal", "regex"]),
  flags: z.string().optional(),
  severity: severitySchema,
  note: z.string().optional(),
  source: sourceSchema.optional(),
});

const templateEntrySchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  severity: severitySchema,
  note: z.string().optional(),
  minOccurrencesForFail: z.number().int().positive().optional(),
  source: sourceSchema.optional(),
});

const aiTellDataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  notes: z.string().optional(),
  sources: z.array(sourceSchema).optional(),
  phrases: z.array(phraseEntrySchema),
  templates: z.array(templateEntrySchema),
});

const bookismEntrySchema = z.object({
  id: z.string().min(1),
  forms: z.array(z.string().min(1)).min(1),
  severity: severitySchema,
  note: z.string().optional(),
  source: sourceSchema.optional(),
});

const saidBookismDataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  notes: z.string().optional(),
  sources: z.array(sourceSchema).optional(),
  banned: z.array(bookismEntrySchema),
  allowed: z.array(z.string()),
});

// Tier 2: the MCP server doesn't grade these itself (no model call embedded
// in the server; see craft-rubric.json's own `notes`). This schema just
// describes the rubric *definitions* an agent fetches before applying one.
const craftRubricEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  definition: z.string().min(1),
  howToCheck: z.string().min(1),
  examples: z
    .object({
      bad: z.array(z.string()).optional(),
      good: z.array(z.string()).optional(),
    })
    .optional(),
  fixHint: z.string().min(1),
  note: z.string().optional(),
  source: sourceSchema.optional(),
});

const craftRubricDataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  notes: z.string().optional(),
  sources: z.array(sourceSchema).optional(),
  rubric: z.array(craftRubricEntrySchema),
});

// Per-character and per-project voice targets. Deliberately has NO
// bundled default and no default file path (unlike the other loaders below)
// The whole point is not pushing every project toward one generic
// "human-sounding" register, so a profile only takes effect when a caller
// explicitly points at their own project's file.
const rhythmOverridesSchema = z.object({
  targetCv: z.number().positive().optional(),
  minSentencesForRhythm: z.number().int().positive().optional(),
});

const styleProfileEntrySchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  register: z.string().optional(),
  verbosity: z.string().optional(),
  vocabulary: z
    .object({
      favor: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
    })
    .optional(),
  notes: z.string().optional(),
  rhythmOverrides: rhythmOverridesSchema.optional(),
});

const styleProfileDataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  notes: z.string().optional(),
  defaultProfile: z.string().optional(),
  profiles: z.array(styleProfileEntrySchema),
});

export type SourceCitation = z.infer<typeof sourceSchema>;
export type PhraseEntry = z.infer<typeof phraseEntrySchema>;
export type TemplateEntry = z.infer<typeof templateEntrySchema>;
export type AiTellData = z.infer<typeof aiTellDataSchema>;
export type BookismEntry = z.infer<typeof bookismEntrySchema>;
export type SaidBookismData = z.infer<typeof saidBookismDataSchema>;
export type CraftRubricEntry = z.infer<typeof craftRubricEntrySchema>;
export type CraftRubricData = z.infer<typeof craftRubricDataSchema>;
export type StyleProfileEntry = z.infer<typeof styleProfileEntrySchema>;
export type StyleProfileData = z.infer<typeof styleProfileDataSchema>;

// Both `src/data-loader.ts` and its compiled `dist/data-loader.js` sit one
// directory below the package root, so "../data" resolves correctly whether
// this runs from source (tests) or from a build.
const PACKAGE_DATA_DIR = fileURLToPath(new URL("../data", import.meta.url));

const cache = new Map<string, unknown>();

function loadJsonFile<T>(absolutePath: string, schema: z.ZodType<T>): T {
  const cached = cache.get(absolutePath);
  if (cached !== undefined) return cached as T;

  let raw: string;
  try {
    raw = readFileSync(absolutePath, "utf-8");
  } catch (error) {
    throw new Error(
      `CanvasLoop: could not read data file at ${absolutePath}: ${(error as Error).message}`,
      { cause: error },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`CanvasLoop: ${absolutePath} is not valid JSON: ${(error as Error).message}`, {
      cause: error,
    });
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`CanvasLoop: ${absolutePath} failed validation:\n${issues}`);
  }

  cache.set(absolutePath, result.data);
  return result.data;
}

export function loadAiTellData(customPath?: string): AiTellData {
  const path = customPath ?? `${PACKAGE_DATA_DIR}/ai-tell-phrases.json`;
  return loadJsonFile(path, aiTellDataSchema);
}

export function loadSaidBookismData(customPath?: string): SaidBookismData {
  const path = customPath ?? `${PACKAGE_DATA_DIR}/said-bookisms.json`;
  return loadJsonFile(path, saidBookismDataSchema);
}

export function loadCraftRubricData(customPath?: string): CraftRubricData {
  const path = customPath ?? `${PACKAGE_DATA_DIR}/craft-rubric.json`;
  return loadJsonFile(path, craftRubricDataSchema);
}

/** No default path (see the schema's own comment). `path` is required, and is always the caller's own project file. */
export function loadStyleProfileData(path: string): StyleProfileData {
  return loadJsonFile(path, styleProfileDataSchema);
}

/** Test-only escape hatch: clears the module-level data cache between cases that use custom fixture paths. */
export function _clearDataCacheForTests(): void {
  cache.clear();
}
