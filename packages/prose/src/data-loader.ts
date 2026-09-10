import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { Severity } from "@canvasloop/core";

const severitySchema: z.ZodType<Severity> = z.enum(["info", "warn", "fail"]);

const phraseEntrySchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  type: z.enum(["literal", "regex"]),
  flags: z.string().optional(),
  severity: severitySchema,
  note: z.string().optional(),
});

const templateEntrySchema = z.object({
  id: z.string().min(1),
  pattern: z.string().min(1),
  severity: severitySchema,
  note: z.string().optional(),
  minOccurrencesForFail: z.number().int().positive().optional(),
});

const aiTellDataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  notes: z.string().optional(),
  phrases: z.array(phraseEntrySchema),
  templates: z.array(templateEntrySchema),
});

const bookismEntrySchema = z.object({
  id: z.string().min(1),
  forms: z.array(z.string().min(1)).min(1),
  severity: severitySchema,
  note: z.string().optional(),
});

const saidBookismDataSchema = z.object({
  version: z.string(),
  updated: z.string(),
  notes: z.string().optional(),
  banned: z.array(bookismEntrySchema),
  allowed: z.array(z.string()),
});

export type PhraseEntry = z.infer<typeof phraseEntrySchema>;
export type TemplateEntry = z.infer<typeof templateEntrySchema>;
export type AiTellData = z.infer<typeof aiTellDataSchema>;
export type BookismEntry = z.infer<typeof bookismEntrySchema>;
export type SaidBookismData = z.infer<typeof saidBookismDataSchema>;

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

/** Test-only escape hatch: clears the module-level data cache between cases that use custom fixture paths. */
export function _clearDataCacheForTests(): void {
  cache.clear();
}
