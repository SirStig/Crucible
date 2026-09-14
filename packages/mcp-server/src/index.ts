#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGradeProsePatternTool } from "./tools/grade-prose-pattern.js";
import { registerIterateProseTool } from "./tools/iterate-prose.js";
import { registerGetProseCraftRubricTool } from "./tools/get-prose-craft-rubric.js";
import { registerGradeProseCraftTool } from "./tools/grade-prose-craft.js";
import { registerGetStyleProfileTool } from "./tools/get-style-profile.js";
import { registerRenderSpriteTool } from "./tools/render-sprite.js";
import { registerGradeSpritePatternTool } from "./tools/grade-sprite-pattern.js";
import { registerIterateSpriteTool } from "./tools/iterate-sprite.js";
import { registerGetSpriteCraftRubricTool } from "./tools/get-sprite-craft-rubric.js";
import { registerGradeSpriteCraftTool } from "./tools/grade-sprite-craft.js";
import { registerGenerateFoliageTool } from "./tools/generate-foliage.js";
import { registerPackSpriteSheetTool } from "./tools/pack-sprite-sheet.js";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

/**
 * One shared server for both tracks: a common shell with track-specific
 * tools registered onto it.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "crucible",
    version: "0.1.0",
    title: "Crucible",
    description:
      "Grounded generate-check-fix loops for AI-agent game content. Track B (prose): Tier 1 deterministic grading for dialogue/UI text (AI-tell phrases, templated constructions, sentence rhythm, said-bookisms, redundancy, word repetition, style-profile vocabulary) plus Tier 2 narrative-craft rubric items the calling agent applies itself. Track A (visual): renders sprite SVG to an exact pixel grid and grades it against a deterministic pixel-art craft rubric (banding, jaggies, dithering overuse, outline inconsistency, too-many-similar-colors, unattached fragments, unintended holes), plus Tier 2 visual-craft rubric items (pillow shading, light-source consistency, hue shifting, selective outlining, silhouette readability, value contrast, shape/proportion plausibility) the calling agent applies itself against the rendered image, plus an L-system foliage generator and a sprite-sheet layout helper.",
  });

  registerGradeProsePatternTool(server);
  registerIterateProseTool(server);
  registerGetProseCraftRubricTool(server);
  registerGradeProseCraftTool(server);
  registerGetStyleProfileTool(server);

  registerRenderSpriteTool(server);
  registerGradeSpritePatternTool(server);
  registerIterateSpriteTool(server);
  registerGetSpriteCraftRubricTool(server);
  registerGradeSpriteCraftTool(server);
  registerGenerateFoliageTool(server);
  registerPackSpriteSheetTool(server);

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only auto-start when this file is run directly (`node dist/index.js`, or
// via the installed `crucible-mcp-server` bin), not when `createServer` is
// imported elsewhere, such as from a test, where starting a stdio transport
// would be an unwanted side effect.
//
// argv[1] needs realpath + pathToFileURL rather than a hand-built `file://`
// string: npm installs the bin as a symlink, so argv[1] is the link path
// while import.meta.url is the resolved target, and a raw interpolation also
// mis-encodes paths containing spaces.
function isMainModule(): boolean {
  const entry = process.argv[1];
  if (entry === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return false;
  }
}
if (isMainModule()) {
  main().catch((error: unknown) => {
    console.error("Crucible MCP server failed to start:", error);
    process.exitCode = 1;
  });
}
