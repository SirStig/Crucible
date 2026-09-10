import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGradeProsePatternTool } from "./tools/grade-prose-pattern.js";
import { registerIterateProseTool } from "./tools/iterate-prose.js";

// TODO(v0.2): grade_prose_craft — Tier 2 narrative rubric (on-the-nose
// dialogue, exposition-dump, voice consistency), model-assisted, one named
// rubric item checked at a time. Not implemented in v0.1: Tier 1 is the
// fully free/local slice and stands on its own.

export function createServer(): McpServer {
  const server = new McpServer({
    name: "canvasloop-prose",
    version: "0.1.0",
    title: "CanvasLoop — Prose Craft Loop",
    description:
      "Tier 1 (deterministic, no model calls) grading for game dialogue and UI prose: AI-tell phrases, templated constructions, sentence rhythm, said-bookisms, and adjacent-line redundancy.",
  });

  registerGradeProsePatternTool(server);
  registerIterateProseTool(server);

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
const isMainModule = process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error: unknown) => {
    console.error("CanvasLoop MCP server failed to start:", error);
    process.exitCode = 1;
  });
}
