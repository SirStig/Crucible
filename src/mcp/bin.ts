#!/usr/bin/env node
import { startServer } from "./index.js";

// Dedicated entry so MCP clients can spawn `npx -y crucible-mcp` directly,
// rather than `npx -y crucible-mcp mcp`. The `crucible mcp` subcommand does
// the same thing for anyone already using the CLI.
startServer().catch((error: unknown) => {
  console.error("Crucible MCP server failed to start:", error);
  process.exitCode = 1;
});
