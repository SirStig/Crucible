import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const sourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1).optional(),
});

// Tier 2: the MCP server doesn't grade these itself (no model call embedded
// in the server; see craft-rubric.json's own `notes`). This schema just
// describes the rubric *definitions* an agent fetches before applying one,
// same shape as Track B's prose craft rubric entries.
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

export type SourceCitation = z.infer<typeof sourceSchema>;
export type VisualCraftRubricEntry = z.infer<typeof craftRubricEntrySchema>;
export type VisualCraftRubricData = z.infer<typeof craftRubricDataSchema>;

// `src/visual/data-loader.ts` and its compiled `dist/visual/data-loader.js`
// sit at the same depth below the package root, so "../../data/visual"
// resolves correctly whether this runs from source (tests) or from a build.
const PACKAGE_DATA_DIR = fileURLToPath(new URL("../../data/visual", import.meta.url));

const cache = new Map<string, unknown>();

function loadJsonFile<T>(absolutePath: string, schema: z.ZodType<T>): T {
  const cached = cache.get(absolutePath);
  if (cached !== undefined) return cached as T;

  let raw: string;
  try {
    raw = readFileSync(absolutePath, "utf-8");
  } catch (error) {
    throw new Error(
      `Crucible: could not read data file at ${absolutePath}: ${(error as Error).message}`,
      { cause: error },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Crucible: ${absolutePath} is not valid JSON: ${(error as Error).message}`, {
      cause: error,
    });
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Crucible: ${absolutePath} failed validation:\n${issues}`);
  }

  cache.set(absolutePath, result.data);
  return result.data;
}

export function loadVisualCraftRubricData(customPath?: string): VisualCraftRubricData {
  const path = customPath ?? `${PACKAGE_DATA_DIR}/craft-rubric.json`;
  return loadJsonFile(path, craftRubricDataSchema);
}

/** Test-only escape hatch: clears the module-level data cache between cases that use custom fixture paths. */
export function _clearDataCacheForTests(): void {
  cache.clear();
}
