import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Finding, FindingLocation } from "canvasloop-core";
import { loadVisualCraftRubricData } from "canvasloop-visual";
import { craftVerdictSchema, findingSchema } from "../schemas.js";

const inputShape = {
  ruleId: z.string().min(1),
  description: z.string().min(1),
  verdict: craftVerdictSchema,
  reasoning: z.string().min(1),
  x: z.number().int().optional(),
  y: z.number().int().optional(),
};

export interface GradeSpriteCraftInput {
  ruleId: string;
  description: string;
  verdict: "pass" | "warn" | "fail";
  reasoning: string;
  x?: number | undefined;
  y?: number | undefined;
}

export interface GradeSpriteCraftOutput {
  ruleId: string;
  verdict: "pass" | "warn" | "fail";
  finding?: Finding;
  // Index signature so this is structurally assignable to the SDK's
  // structuredContent type (see the identical note on core's GradeResult).
  [key: string]: unknown;
}

/**
 * Records the calling agent's own Tier 2 judgment call. The agent has
 * already fetched the rubric item via get_sprite_craft_rubric, looked at
 * the rendered sprite, and applied the rubric itself; this tool validates
 * the ruleId, structures a non-passing verdict into a Finding shaped like
 * the Tier 1 ones (with an optional x/y pointing at the offending region),
 * and hands it back. It does not evaluate the image itself.
 */
export function gradeSpriteCraftHandler(input: GradeSpriteCraftInput) {
  const data = loadVisualCraftRubricData();
  const entry = data.rubric.find((item) => item.id === input.ruleId);
  if (!entry) {
    throw new Error(
      `CanvasLoop: no Tier 2 rubric item named "${input.ruleId}". Call get_sprite_craft_rubric first to see available items.`,
    );
  }

  let output: GradeSpriteCraftOutput = { ruleId: entry.id, verdict: input.verdict };

  if (input.verdict !== "pass") {
    const location: FindingLocation = { excerpt: input.description };
    if (input.x !== undefined) location.x = input.x;
    if (input.y !== undefined) location.y = input.y;

    const finding: Finding = {
      id: "visual.craft-rubric",
      ruleId: entry.id,
      severity: input.verdict,
      message: `${entry.name}: ${input.reasoning}`,
      location,
      data: { reasoning: input.reasoning },
      fixHint: entry.fixHint,
    };
    output = { ...output, finding };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

export function registerGradeSpriteCraftTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "grade_sprite_craft",
    {
      title: "Record a Tier 2 visual-craft verdict",
      description:
        "Records your own judgment call on one named Tier 2 rubric item (fetched first via get_sprite_craft_rubric) applied to a rendered sprite, structuring it into a Finding when the verdict isn't a clean pass. This tool does not evaluate the image itself: look at the rendered sprite yourself, apply the rubric definition, and supply the verdict, your reasoning, and optionally the x/y pixel coordinates of the region the finding is about.",
      inputSchema: inputShape,
      outputSchema: {
        ruleId: z.string(),
        verdict: craftVerdictSchema,
        finding: findingSchema.optional(),
      },
    },
    gradeSpriteCraftHandler,
  );
}
