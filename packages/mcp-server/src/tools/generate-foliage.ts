import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateFoliagePreset, generateFoliageSvg, renderSprite, FOLIAGE_PRESETS } from "@canvasloop/visual";
import type { LSystemSpec } from "@canvasloop/visual";

const lSystemSpecSchema = z.object({
  axiom: z.string().min(1),
  rules: z.record(z.string(), z.string()),
  iterations: z.number().int().min(0).max(10),
  angleDegrees: z.number(),
  stepLength: z.number().positive(),
  startX: z.number().optional(),
  startY: z.number().optional(),
  startAngleDegrees: z.number().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().positive().optional(),
});

const inputShape = {
  preset: z.string().optional(),
  spec: lSystemSpecSchema.optional(),
  includePreview: z.boolean().optional(),
};

export interface GenerateFoliageInput {
  preset?: string | undefined;
  spec?: LSystemSpec | undefined;
  includePreview?: boolean | undefined;
}

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; data: string; mimeType: string };

/**
 * The tool's actual logic, exported standalone so tests can call it
 * directly without spinning up a transport.
 */
export function generateFoliageHandler(input: GenerateFoliageInput) {
  if (input.spec === undefined && input.preset === undefined) {
    throw new Error("CanvasLoop: generate_foliage needs either `preset` or `spec`.");
  }

  const result = input.spec !== undefined ? generateFoliageSvg(input.spec) : generateFoliagePreset(input.preset!);
  const output = { svg: result.svg, width: result.width, height: result.height };
  const content: ContentBlock[] = [{ type: "text", text: JSON.stringify(output, null, 2) }];

  if (input.includePreview) {
    const rendered = renderSprite({ svg: result.svg, gridWidth: result.width, gridHeight: result.height });
    content.push({ type: "image", data: rendered.png.toString("base64"), mimeType: "image/png" });
  }

  return { content, structuredContent: output };
}

export function registerGenerateFoliageTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "generate_foliage",
    {
      title: "Generate procedural foliage via an L-system",
      description: `Expands a Lindenmayer-system grammar into turtle-graphics SVG output. Pass a named preset (${Object.keys(FOLIAGE_PRESETS).join(", ")}) or a full custom spec (axiom, rules, iterations, angleDegrees, stepLength). Set includePreview to also get a rendered PNG image back — otherwise this only returns SVG text. The output is plain SVG, meant to be fed into grade_sprite_pattern/render_sprite like any other sprite if you want it graded.`,
      inputSchema: inputShape,
      outputSchema: { svg: z.string(), width: z.number().int(), height: z.number().int() },
    },
    generateFoliageHandler,
  );
}
