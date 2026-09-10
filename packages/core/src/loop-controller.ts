import type { GradeResult, IterationRecord, LineDiff, LoopSession, LoopStatus } from "./types.js";

export interface LoopControllerOptions {
  /** Iterations allowed per session before it's reported as "exceeded". Must be a positive integer. */
  defaultMaxIterations: number;
}

export interface RecordOptions {
  /**
   * Only honored on a session's first `record()` call — a session's iteration
   * budget is fixed at creation so a caller can't quietly raise the ceiling
   * mid-loop by passing a different value on a later call.
   */
  maxIterations?: number;
  diff?: LineDiff[];
}

export interface RecordResult<TInput> {
  record: IterationRecord<TInput>;
  session: LoopSession<TInput>;
}

/**
 * Tracks per-session revision history for a generate -> check -> fix loop.
 * Deliberately track-agnostic (works on `GradeResult` alone) so it's shared
 * by every craft track rather than reimplemented per domain.
 */
export class LoopController<TInput> {
  private readonly defaultMaxIterations: number;
  private readonly sessions = new Map<string, LoopSession<TInput>>();

  constructor(options: LoopControllerOptions) {
    if (!Number.isInteger(options.defaultMaxIterations) || options.defaultMaxIterations < 1) {
      throw new RangeError("defaultMaxIterations must be a positive integer");
    }
    this.defaultMaxIterations = options.defaultMaxIterations;
  }

  record(
    sessionId: string,
    input: TInput,
    result: GradeResult,
    opts: RecordOptions = {},
  ): RecordResult<TInput> {
    if (sessionId.trim().length === 0) {
      throw new RangeError("sessionId must be a non-empty string");
    }

    let session = this.sessions.get(sessionId);
    if (!session) {
      const requested = opts.maxIterations;
      const maxIterations =
        requested !== undefined && Number.isInteger(requested) && requested >= 1
          ? requested
          : this.defaultMaxIterations;
      session = { sessionId, maxIterations, iterations: [], status: "pass" };
      this.sessions.set(sessionId, session);
    }

    const record: IterationRecord<TInput> = {
      iteration: session.iterations.length + 1,
      input,
      result,
      timestamp: new Date().toISOString(),
      ...(opts.diff !== undefined ? { diff: opts.diff } : {}),
    };
    session.iterations.push(record);

    const gateStatus: LoopStatus = result.status === "fail" ? "fail" : "pass";
    session.status = session.iterations.length > session.maxIterations ? "exceeded" : gateStatus;

    return { record, session };
  }

  getSession(sessionId: string): LoopSession<TInput> | undefined {
    return this.sessions.get(sessionId);
  }
}
