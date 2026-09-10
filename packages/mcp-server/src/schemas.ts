import { z } from "zod";

export const severitySchema = z.enum(["info", "warn", "fail"]);
export const gradeStatusSchema = z.enum(["pass", "warn", "fail"]);

export const findingLocationSchema = z.object({
  line: z.number().int().optional(),
  sentenceIndex: z.number().int().optional(),
  charStart: z.number().int().optional(),
  charEnd: z.number().int().optional(),
  excerpt: z.string().optional(),
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
});

export type GradeOptionsInput = z.infer<typeof gradeOptionsSchema>;
