import { z } from "zod";

export const severitySchema = z.enum(["info", "warn", "fail"]);
export const gradeStatusSchema = z.enum(["pass", "warn", "fail"]);

export const findingLocationSchema = z.object({
  line: z.number().int().optional(),
  sentenceIndex: z.number().int().optional(),
  charStart: z.number().int().optional(),
  charEnd: z.number().int().optional(),
  excerpt: z.string().optional(),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
});

export const findingSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  severity: severitySchema,
  message: z.string(),
  location: findingLocationSchema.optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  fixHint: z.string(),
});

export const gradeResultSchema = z.object({
  status: gradeStatusSchema,
  findings: z.array(findingSchema),
  summary: z.record(z.string(), z.unknown()),
  gradedAt: z.string(),
});

export const lineDiffSchema = z.object({
  type: z.enum(["added", "removed", "unchanged", "changed"]),
  lineIndex: z.number().int(),
  before: z.string().optional(),
  after: z.string().optional(),
});

export const gradeOptionsSchema = z.object({
  minSentencesForRhythm: z.number().int().positive().optional(),
  targetCv: z.number().positive().optional(),
  minTokensForRedundancy: z.number().int().positive().optional(),
  redundancyThreshold: z.number().min(0).max(1).optional(),
  phrasesFile: z.string().optional(),
  bookismsFile: z.string().optional(),
  minLinesForRepetition: z.number().int().positive().optional(),
  minOccurrenceLines: z.number().int().positive().optional(),
  repetitionLineRatio: z.number().min(0).max(1).optional(),
  styleProfilesFile: z.string().optional(),
  styleProfileId: z.string().optional(),
});

export type GradeOptionsInput = z.infer<typeof gradeOptionsSchema>;

export const craftRubricEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  definition: z.string(),
  howToCheck: z.string(),
  examples: z
    .object({
      bad: z.array(z.string()).optional(),
      good: z.array(z.string()).optional(),
    })
    .optional(),
  fixHint: z.string(),
  note: z.string().optional(),
});

export const craftVerdictSchema = z.enum(["pass", "warn", "fail"]);

export const styleProfileEntrySchema = z.object({
  id: z.string(),
  displayName: z.string(),
  register: z.string().optional(),
  verbosity: z.string().optional(),
  vocabulary: z
    .object({
      favor: z.array(z.string()).optional(),
      avoid: z.array(z.string()).optional(),
    })
    .optional(),
  notes: z.string().optional(),
  rhythmOverrides: z
    .object({
      targetCv: z.number().positive().optional(),
      minSentencesForRhythm: z.number().int().positive().optional(),
    })
    .optional(),
});

// --- Track A (visual) ---

export const spriteInputShape = {
  svg: z.string().min(1),
  gridWidth: z.number().int().positive(),
  gridHeight: z.number().int().positive(),
};

export const visualGradeOptionsSchema = z.object({
  minRegionSizeForBanding: z.number().int().positive().optional(),
  bandingElongationThreshold: z.number().positive().optional(),
  minDiagonalRunForJaggies: z.number().int().positive().optional(),
  jaggiesTreadCv: z.number().positive().optional(),
  ditherMaxTransitionWidth: z.number().positive().optional(),
  outlineInconsistencyRatio: z.number().min(0).max(1).optional(),
  colorClusterDistance: z.number().positive().optional(),
  colorCountRatio: z.number().positive().optional(),
});

export type VisualGradeOptionsInput = z.infer<typeof visualGradeOptionsSchema>;
