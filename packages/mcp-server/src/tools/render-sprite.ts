import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { renderSprite } from "@canvasloop/visual";
import { spriteInputShape } from "../schemas.js";

export interface RenderSpriteInput {
  svg: string;
  gridWidth: number;
  gridHeight: number;
}

/**
 * The tool's actual logic, exported standalone so tests can call it
 * directly without spinning up a transport.
 */
export function renderSpriteHandler(input: RenderSpriteInput) {
  const rendered = renderSprite(input);
  const summary = { width: rendered.width, height: rendered.height };
  return {
    content: [
      { type: "image" as const, data: rendered.png.toString("base64"), mimeType: "image/png" },
      { type: "text" as const, text: JSON.stringify(summary, null, 2) },
    ],
    structuredContent: summary,
  };
}

export function registerRenderSpriteTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "render_sprite",
    {
      title: "Render a sprite's SVG to a pixel-grid image",
      description:
        "Renders SVG markup to an exact gridWidth x gridHeight pixel image and returns it as an actual picture rather than just numbers, closing the render-and-see loop an agent otherwise doesn't have while drawing code blind. No grading; use grade_sprite_pattern for that. gridWidth/gridHeight are authoritative: any width/height/viewBox already on the SVG root is overridden to match.",
      inputSchema: spriteInputShape,
      outputSchema: { width: z.number().int(), height: z.number().int() },
    },
    renderSpriteHandler,
  );
}
