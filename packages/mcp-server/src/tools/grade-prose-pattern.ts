import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parseDialogueFile, gradeProsePattern } from "@canvasloop/prose";
import { gradeOptionsSchema, gradeResultSchema, type GradeOptionsInput } from "../schemas.js";

const inputShape = {
  text: z.string(),
  options: gradeOptionsSchema.optional(),
};

export interface GradeProsePatternInput {
  text: string;
  // `| undefined` explicit: this must structurally match the zod-inferred
  // ShapeOutput of `inputShape` below, which always includes `undefined` on
  // an optional field, not just omit it.
  options?: GradeOptionsInput | undefined;
}

/**
 * The tool's actual logic, exported standalone so tests can call it directly
 * without spinning up a transport or an McpServer instance.
 */
export async function gradeProsePatternHandler(input: GradeProsePatternInput) {
  const lines = parseDialogueFile(input.text);
  const result = gradeProsePattern(lines, input.options ?? {});
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent: result,
  };
}

export function registerGradeProsePatternTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "grade_prose_pattern",
    {
      title: "Grade prose against the Tier 1 pattern rubric",
      description:
        "Deterministic, no-model-call check for AI-tell phrases, templated balanced-contrast constructions, sentence-rhythm uniformity, said-bookisms, and adjacent-line redundancy. Input uses the 'Speaker: line text' convention; the speaker prefix is optional per line, so plain prose/UI strings work too.",
      inputSchema: inputShape,
      outputSchema: gradeResultSchema.shape,
    },
    gradeProsePatternHandler,
  );
}
