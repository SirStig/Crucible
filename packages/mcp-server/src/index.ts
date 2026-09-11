import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGradeProsePatternTool } from "./tools/grade-prose-pattern.js";
import { registerIterateProseTool } from "./tools/iterate-prose.js";
import { registerGetProseCraftRubricTool } from "./tools/get-prose-craft-rubric.js";
import { registerGradeProseCraftTool } from "./tools/grade-prose-craft.js";

// Voice-consistency (per-character style profiles, FR18) isn't in the Tier 2
// rubric yet — it needs a style-profile store that doesn't exist in v0.1.
// The other three Tier 2 items (self-justifying-explanation, on-the-nose
// dialogue, exposition-dump) are live via get_prose_craft_rubric /
// grade_prose_craft below.

export function createServer(): McpServer {
  const server = new McpServer({
    name: "canvasloop-prose",
    version: "0.1.0",
    title: "CanvasLoop — Prose Craft Loop",
    description:
      "Tier 1 (deterministic, no model calls) grading for game dialogue and UI prose — AI-tell phrases, templated constructions, sentence rhythm, said-bookisms, adjacent-line redundancy, and document-wide word repetition — plus Tier 2 narrative-craft rubric items the calling agent applies with its own judgment.",
  });

  registerGradeProsePatternTool(server);
  registerIterateProseTool(server);
  registerGetProseCraftRubricTool(server);
  registerGradeProseCraftTool(server);

  return server;
}

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only auto-start when this file is run directly (`node dist/index.js`) —
// not when `createServer` is imported elsewhere, such as from a test, where
// starting a stdio transport would be an unwanted side effect.
const isMainModule =
  process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error("CanvasLoop MCP server failed to start:", error);
    process.exitCode = 1;
  });
}
