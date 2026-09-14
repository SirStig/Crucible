import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Finding } from "../../base/index.js";
import { loadCraftRubricData } from "../../prose/index.js";
import { craftVerdictSchema, findingSchema } from "../schemas.js";

const inputShape = {
  ruleId: z.string().min(1),
  text: z.string(),
  verdict: craftVerdictSchema,
  reasoning: z.string().min(1),
  line: z.number().int().optional(),
};

export interface GradeProseCraftInput {
  ruleId: string;
  text: string;
  verdict: "pass" | "warn" | "fail";
  reasoning: string;
  line?: number | undefined;
}

export interface GradeProseCraftOutput {
  ruleId: string;
  verdict: "pass" | "warn" | "fail";
  finding?: Finding;
  // Index signature so this is structurally assignable to the SDK's
  // structuredContent type (see the identical note on core's GradeResult).
  [key: string]: unknown;
}

/**
 * Records the calling agent's own Tier 2 judgment call. The agent has
 * already fetched the rubric item via get_prose_craft_rubric and applied it
 * itself; this tool validates the ruleId, structures a non-passing verdict
 * into a Finding shaped like the Tier 1 ones, and hands it back. It does
 * not evaluate the text itself.
 */
export function gradeProseCraftHandler(input: GradeProseCraftInput) {
  const data = loadCraftRubricData();
  const entry = data.rubric.find((item) => item.id === input.ruleId);
  if (!entry) {
    throw new Error(
      `Crucible: no Tier 2 rubric item named "${input.ruleId}". Call get_prose_craft_rubric first to see available items.`,
    );
  }

  let output: GradeProseCraftOutput = { ruleId: entry.id, verdict: input.verdict };

  if (input.verdict !== "pass") {
    const finding: Finding = {
      id: "prose.craft-rubric",
      ruleId: entry.id,
      severity: input.verdict,
      message: `${entry.name}: ${input.reasoning}`,
      location:
        input.line !== undefined
          ? { line: input.line, excerpt: input.text }
          : { excerpt: input.text },
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

export function registerGradeProseCraftTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "grade_prose_craft",
    {
      title: "Record a Tier 2 narrative-craft verdict",
      description:
        "Records your own judgment call on one named Tier 2 rubric item (fetched first via get_prose_craft_rubric) applied to a piece of text, structuring it into a Finding when the verdict isn't a clean pass. This tool does not evaluate the text itself: apply the rubric definition yourself and supply the verdict and your reasoning.",
      inputSchema: inputShape,
      outputSchema: {
        ruleId: z.string(),
        verdict: craftVerdictSchema,
        finding: findingSchema.optional(),
      },
    },
    gradeProseCraftHandler,
  );
}
