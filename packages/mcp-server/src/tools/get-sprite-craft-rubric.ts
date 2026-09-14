import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadVisualCraftRubricData } from "@canvasloop/visual";
import { craftRubricEntrySchema } from "../schemas.js";

const inputShape = {
  ruleId: z.string().optional(),
};

export interface GetSpriteCraftRubricInput {
  ruleId?: string | undefined;
}

/**
 * Tier 2 has no model call embedded in the server (see craft-rubric.json's
 * own `notes`). This tool's only job is handing the calling agent a named
 * visual-craft rubric definition to apply with its own judgment against the
 * rendered sprite (fetch that first via render_sprite or grade_sprite_pattern,
 * both of which return an image content block). Grading itself happens via
 * grade_sprite_craft, after the agent has read the definition here.
 */
export function getSpriteCraftRubricHandler(input: GetSpriteCraftRubricInput) {
  const data = loadVisualCraftRubricData();

  if (input.ruleId !== undefined) {
    const match = data.rubric.filter((entry) => entry.id === input.ruleId);
    if (match.length === 0) {
      throw new Error(
        `CanvasLoop: no Tier 2 rubric item named "${input.ruleId}". Call get_sprite_craft_rubric with no ruleId to list available items.`,
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

export function registerGetSpriteCraftRubricTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "get_sprite_craft_rubric",
    {
      title: "Fetch a Tier 2 visual-craft rubric definition",
      description:
        "Returns one named visual-craft rubric item (pass a ruleId), or every available item (omit it): pillow shading, cross-sprite light-source consistency, hue shifting, selective outlining, silhouette readability, and value contrast range. This tool does not grade anything itself: render the sprite first (render_sprite or grade_sprite_pattern, both return the rendered image), read the rubric definition and examples here, apply it to the image using your own visual judgment, then report your verdict through grade_sprite_craft.",
      inputSchema: inputShape,
      outputSchema: { rubric: z.array(craftRubricEntrySchema) },
    },
    getSpriteCraftRubricHandler,
  );
}
