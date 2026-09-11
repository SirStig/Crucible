import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { packSpriteSheet } from "@canvasloop/visual";

const frameSchema = z.object({
  svg: z.string().min(1),
  gridWidth: z.number().int().positive(),
  gridHeight: z.number().int().positive(),
  name: z.string().optional(),
});

const inputShape = {
  frames: z.array(frameSchema).min(1),
  columns: z.number().int().positive(),
};

const frameMetaSchema = z.object({
  index: z.number().int(),
  name: z.string().optional(),
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int(),
  height: z.number().int(),
});

export interface PackSpriteSheetInput {
  frames: { svg: string; gridWidth: number; gridHeight: number; name?: string | undefined }[];
  columns: number;
}

/**
 * The tool's actual logic, exported standalone so tests can call it
 * directly without spinning up a transport.
 */
export function packSpriteSheetHandler(input: PackSpriteSheetInput) {
  const result = packSpriteSheet(input.frames, input.columns);
  const summary = {
    columns: result.columns,
    rows: result.rows,
    cellWidth: result.cellWidth,
    cellHeight: result.cellHeight,
    frames: result.frames,
  };
  return {
    content: [
      { type: "image" as const, data: result.png.toString("base64"), mimeType: "image/png" },
      { type: "text" as const, text: JSON.stringify(summary, null, 2) },
    ],
    structuredContent: summary,
  };
}

export function registerPackSpriteSheetTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "pack_sprite_sheet",
    {
      title: "Lay out multiple sprite frames into one grid-aligned sheet",
      description:
        "Renders each frame and packs them into one sheet image at uniform cell size, returning the sheet PNG and per-frame layout metadata (for later engine-specific export). Every frame must share the same gridWidth/gridHeight — mismatched frames are a clear input error, not silently stretched to fit.",
      inputSchema: inputShape,
      outputSchema: {
        columns: z.number().int(),
        rows: z.number().int(),
        cellWidth: z.number().int(),
        cellHeight: z.number().int(),
        frames: z.array(frameMetaSchema),
      },
    },
    packSpriteSheetHandler,
  );
}
