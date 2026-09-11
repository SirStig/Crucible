import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { renderSprite, gradeRenderedSprite } from "@canvasloop/visual";
import {
  spriteInputShape,
  visualGradeOptionsSchema,
  gradeResultSchema,
  type VisualGradeOptionsInput,
} from "../schemas.js";

const inputShape = {
  ...spriteInputShape,
  options: visualGradeOptionsSchema.optional(),
};

export interface GradeSpritePatternInput {
  svg: string;
  gridWidth: number;
  gridHeight: number;
  options?: VisualGradeOptionsInput | undefined;
}

/**
 * The tool's actual logic, exported standalone so tests can call it
 * directly without spinning up a transport. Renders once and grades that
 * same render, so the image the agent sees and the findings it gets are
 * guaranteed to match.
 */
export function gradeSpritePatternHandler(input: GradeSpritePatternInput) {
  const rendered = renderSprite(input);
  const result = gradeRenderedSprite(rendered, input.options ?? {});
  return {
    content: [
      { type: "image" as const, data: rendered.png.toString("base64"), mimeType: "image/png" },
      { type: "text" as const, text: JSON.stringify(result, null, 2) },
    ],
    structuredContent: result,
  };
}

export function registerGradeSpritePatternTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "grade_sprite_pattern",
    {
      title: "Grade a sprite against the Tier 1 pixel-art rubric",
      description:
        "Renders SVG to a gridWidth x gridHeight pixel image and grades it against the deterministic, no-model-call Tier 1 rubric — structural sanity, banding, jaggies, dithering overuse, outline inconsistency, too-many-similar-colors — returning both the rendered image and the findings in one call.",
      inputSchema: inputShape,
      outputSchema: gradeResultSchema.shape,
    },
    gradeSpritePatternHandler,
  );
}
