import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Finding, GradeStatus } from "crucible-base";
import { diffLines } from "crucible-base";
import { renderSprite, gradeRenderedSprite } from "crucible-visual";
import {
  spriteInputShape,
  visualGradeOptionsSchema,
  gradeResultSchema,
  lineDiffSchema,
  findingSchema,
  type VisualGradeOptionsInput,
} from "../schemas.js";
import { spriteSessionStore } from "../session-store.js";

const inputShape = {
  sessionId: z.string().min(1),
  ...spriteInputShape,
  maxIterations: z.number().int().positive().optional(),
  options: visualGradeOptionsSchema.optional(),
  // Connects Tier 1 and Tier 2 into one loop: pass the Finding(s) returned
  // by grade_sprite_craft for this same render, and they're folded into
  // this iteration's grade/status/history alongside the Tier 1 pixel-pattern
  // findings into one session and one status, instead of two disconnected tool flows.
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

export interface IterateSpriteInput {
  sessionId: string;
  svg: string;
  gridWidth: number;
  gridHeight: number;
  maxIterations?: number | undefined;
  options?: VisualGradeOptionsInput | undefined;
  craftFindings?: Finding[] | undefined;
}

function combinedStatus(findings: readonly Finding[]): GradeStatus {
  if (findings.some((finding) => finding.severity === "fail")) return "fail";
  if (findings.some((finding) => finding.severity === "warn")) return "warn";
  return "pass";
}

/**
 * The tool's actual logic, exported standalone so tests can drive a
 * multi-call session directly without a transport. Diffs the SVG *source*
 * text line-by-line (reusing `diffLines` from `crucible-base`, so no new
 * diff algorithm needed) rather than diffing pixels, since "what changed"
 * is more useful to an agent as source-level context than a raster delta.
 */
export function iterateSpriteHandler(input: IterateSpriteInput) {
  const rendered = renderSprite(input);
  const patternGrade = gradeRenderedSprite(rendered, input.options ?? {});
  const craftFindings = input.craftFindings ?? [];

  const grade =
    craftFindings.length === 0
      ? patternGrade
      : {
          ...patternGrade,
          findings: [...patternGrade.findings, ...craftFindings],
          status: combinedStatus([...patternGrade.findings, ...craftFindings]),
        };

  const svgLines = input.svg.split(/\r\n|\r|\n/);

  const previous = spriteSessionStore.getSession(input.sessionId)?.iterations.at(-1)?.input;
  const diff = previous !== undefined ? diffLines(previous, svgLines) : [];

  const { record, session } = spriteSessionStore.record(input.sessionId, svgLines, grade, {
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
    content: [
      { type: "image" as const, data: rendered.png.toString("base64"), mimeType: "image/png" },
      { type: "text" as const, text: JSON.stringify(output, null, 2) },
    ],
    structuredContent: output,
  };
}

export function registerIterateSpriteTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "iterate_sprite",
    {
      title: "Track sprite revision iterations for one editing session",
      description:
        "Grades a sprite with the same Tier 1 pixel-art rubric as grade_sprite_pattern, tracks iteration count per sessionId (in-memory, for this server process's lifetime only), diffs the current SVG source lines against the previous iteration's, and enforces a max-iteration cutoff (default 5, fixed by the first call for a given session). Optionally accepts craftFindings, the Finding(s) grade_sprite_craft returned for this same render, and folds them into this iteration's grade and status, so Tier 1 and Tier 2 results live in one session instead of two disconnected checks.",
      inputSchema: inputShape,
      outputSchema: outputShape,
    },
    iterateSpriteHandler,
  );
}
