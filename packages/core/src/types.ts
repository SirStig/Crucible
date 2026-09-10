/**
 * Shared, track-agnostic types for the CanvasLoop generate -> check -> fix loop.
 * Any craft track (prose today, visual craft later) grades its own domain object
 * into a `GradeResult` and hands it to a `LoopController` for iteration bookkeeping.
 */

export type Severity = "info" | "warn" | "fail";

export type GradeStatus = "pass" | "warn" | "fail";

export interface FindingLocation {
  /** 1-based line number in the original input, when the finding is line-scoped. */
  line?: number;
  /** 0-based index into the sentence pool, when the finding is sentence-scoped. */
  sentenceIndex?: number;
  charStart?: number;
  charEnd?: number;
  /** Short surrounding text, for a human-readable report. */
  excerpt?: string;
}

export interface Finding {
  /** Stable, dotted identifier for the category of check, e.g. "prose.ai-tell-phrase". */
  id: string;
  /** The specific rule that fired within that category, e.g. "delve-into" or "not-just-x-its-y". */
  ruleId: string;
  severity: Severity;
  message: string;
  location?: FindingLocation;
  /** Structured detail (matched text, similarity score, counts) for programmatic consumers. */
  data?: Record<string, unknown>;
  fixHint: string;
}

export interface GradeResult<TSummary = Record<string, unknown>> {
  status: GradeStatus;
  findings: Finding[];
  summary: TSummary;
  /** ISO 8601 timestamp of when this grade was produced. */
  gradedAt: string;
  // Index signature so a GradeResult value — the shape returned straight
  // across a protocol boundary (e.g. as an MCP tool's structuredContent) —
  // is structurally assignable to a Record<string, unknown>-typed target
  // without a manual cast at every call site.
  [key: string]: unknown;
}

export type LineDiffType = "added" | "removed" | "unchanged" | "changed";

export interface LineDiff {
  type: LineDiffType;
  /** Index in the "after" sequence for added/changed/unchanged; index in the "before" sequence for removed. */
  lineIndex: number;
  before?: string;
  after?: string;
}

export type LoopStatus = "pass" | "fail" | "exceeded";

export interface IterationRecord<TInput> {
  /** 1-based iteration number within the session. */
  iteration: number;
  input: TInput;
  result: GradeResult;
  diff?: LineDiff[];
  timestamp: string;
}

export interface LoopSession<TInput> {
  sessionId: string;
  maxIterations: number;
  iterations: IterationRecord<TInput>[];
  status: LoopStatus;
}
