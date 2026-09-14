import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadCraftRubricData } from "crucible-prose";
import { craftRubricEntrySchema } from "../schemas.js";

const inputShape = {
  ruleId: z.string().optional(),
};

export interface GetProseCraftRubricInput {
  ruleId?: string | undefined;
}

/**
 * Tier 2 has no model call embedded in the server (see craft-rubric.json's
 * own `notes`). This tool's only job is handing the calling agent a named
 * rubric definition to apply with its own judgment. Grading itself happens
 * via grade_prose_craft, after the agent has read the definition here.
 */
export function getProseCraftRubricHandler(input: GetProseCraftRubricInput) {
  const data = loadCraftRubricData();

  if (input.ruleId !== undefined) {
    const match = data.rubric.filter((entry) => entry.id === input.ruleId);
    if (match.length === 0) {
      throw new Error(
        `Crucible: no Tier 2 rubric item named "${input.ruleId}". Call get_prose_craft_rubric with no ruleId to list available items.`,
      );
    }
    const output = { rubric: match };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  }

  const output = { rubric: data.rubric };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

export function registerGetProseCraftRubricTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "get_prose_craft_rubric",
    {
      title: "Fetch a Tier 2 narrative-craft rubric definition",
      description:
        "Returns one named narrative-craft rubric item (pass a ruleId), or every available item (omit it): on-the-nose dialogue, exposition dumps, self-justifying or over-explaining prose. This tool does not grade anything itself: read the definition and examples, apply the rubric to your text using your own judgment, then report your verdict through grade_prose_craft.",
      inputSchema: inputShape,
      outputSchema: { rubric: z.array(craftRubricEntrySchema) },
    },
    getProseCraftRubricHandler,
  );
}
