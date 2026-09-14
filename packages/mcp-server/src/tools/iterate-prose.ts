import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Finding, GradeStatus } from "@canvasloop/core";
import { diffLines } from "@canvasloop/core";
import { parseDialogueFile, gradeProsePattern } from "@canvasloop/prose";
import {
  gradeOptionsSchema,
  gradeResultSchema,
  lineDiffSchema,
  findingSchema,
  type GradeOptionsInput,
} from "../schemas.js";
import { proseSessionStore } from "../session-store.js";

const inputShape = {
  sessionId: z.string().min(1),
  text: z.string(),
  maxIterations: z.number().int().positive().optional(),
  options: gradeOptionsSchema.optional(),
  // Connects Tier 1 and Tier 2 into one loop: pass the Finding(s) returned
  // by grade_prose_craft for this same draft, and they're folded into this
  // iteration's grade/status/history alongside the Tier 1 pattern findings
  // into one session and one status, instead of two disconnected tool flows.
  craftFindings: z.array(findingSchema).optional(),
};

const outputShape = {
  sessionId: z.string(),
  iteration: z.number().int(),
  status: z.enum(["pass", "fail", "exceeded"]),
  grade: gradeResultSchema,
  diff: z.array(lineDiffSchema),
  iterationsRemaining: z.number().int(),
};

export interface IterateProseInput {
  sessionId: string;
  text: string;
  // `| undefined` explicit on optional fields: must structurally match the
  // zod-inferred ShapeOutput of `inputShape` below.
  maxIterations?: number | undefined;
  options?: GradeOptionsInput | undefined;
  craftFindings?: Finding[] | undefined;
}

function combinedStatus(findings: readonly Finding[]): GradeStatus {
  if (findings.some((finding) => finding.severity === "fail")) return "fail";
  if (findings.some((finding) => finding.severity === "warn")) return "warn";
  return "pass";
}

/**
 * The tool's actual logic, exported standalone so tests can drive a
 * multi-call session directly without a transport.
 */
export function iterateProseHandler(input: IterateProseInput) {
  const lines = parseDialogueFile(input.text);
  const patternGrade = gradeProsePattern(lines, input.options ?? {});
  const craftFindings = input.craftFindings ?? [];

  const grade =
    craftFindings.length === 0
      ? patternGrade
      : {
          ...patternGrade,
          findings: [...patternGrade.findings, ...craftFindings],
          status: combinedStatus([...patternGrade.findings, ...craftFindings]),
        };

  const rawLines = lines.map((line) => line.raw);
  const previous = proseSessionStore.getSession(input.sessionId)?.iterations.at(-1)?.input;
  const diff = previous !== undefined ? diffLines(previous, rawLines) : [];

  const { record, session } = proseSessionStore.record(input.sessionId, rawLines, grade, {
    ...(input.maxIterations !== undefined ? { maxIterations: input.maxIterations } : {}),
    diff,
  });

  const output = {
    sessionId: input.sessionId,
    iteration: record.iteration,
    status: session.status,
    grade,
    diff,
    iterationsRemaining: Math.max(0, session.maxIterations - session.iterations.length),
  };

  return {
    content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

export function registerIterateProseTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "iterate_prose",
    {
      title: "Track prose revision iterations for one editing session",
      description:
        "Grades text with the same Tier 1 pattern rubric as grade_prose_pattern, tracks iteration count per sessionId (in-memory, for this server process's lifetime only), diffs the current lines against the previous iteration's, and enforces a max-iteration cutoff (default 5, fixed by the first call for a given session). Optionally accepts craftFindings, the Finding(s) grade_prose_craft returned for this same draft, and folds them into this iteration's grade and status, so Tier 1 and Tier 2 results live in one session instead of two disconnected checks.",
      inputSchema: inputShape,
      outputSchema: outputShape,
    },
    iterateProseHandler,
  );
}
