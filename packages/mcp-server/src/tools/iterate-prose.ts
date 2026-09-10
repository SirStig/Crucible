import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { diffLines } from "@canvasloop/core";
import { parseDialogueFile, gradeProsePattern } from "@canvasloop/prose";
import { gradeOptionsSchema, gradeResultSchema, lineDiffSchema, type GradeOptionsInput } from "../schemas.js";
import { proseSessionStore } from "../session-store.js";

const inputShape = {
  sessionId: z.string().min(1),
  text: z.string(),
  maxIterations: z.number().int().positive().optional(),
  options: gradeOptionsSchema.optional(),
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
  // `| undefined` explicit on both optional fields: must structurally match
  // the zod-inferred ShapeOutput of `inputShape` below.
  maxIterations?: number | undefined;
  options?: GradeOptionsInput | undefined;
}

/**
 * The tool's actual logic, exported standalone so tests can drive a
 * multi-call session directly without a transport.
 */
export async function iterateProseHandler(input: IterateProseInput) {
  const lines = parseDialogueFile(input.text);
  const grade = gradeProsePattern(lines, input.options ?? {});
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
        "Grades text with the same Tier 1 pattern rubric as grade_prose_pattern, but also tracks iteration count per sessionId (in-memory, for this server process's lifetime only), diffs the current lines against the previous iteration's, and enforces a max-iteration cutoff (default 5, fixed by the first call for a given session).",
      inputSchema: inputShape,
      outputSchema: outputShape,
    },
    iterateProseHandler,
  );
}
