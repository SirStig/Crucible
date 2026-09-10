import { describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGradeProsePatternTool } from "../src/tools/grade-prose-pattern.js";
import { registerIterateProseTool } from "../src/tools/iterate-prose.js";
import { createServer } from "../src/index.js";

describe("MCP server tool registration", () => {
  it("registers grade_prose_pattern as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGradeProsePatternTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("no-model-call");
  });

  it("registers iterate_prose as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerIterateProseTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("sessionId");
  });

  it("createServer wires up both tools without throwing or connecting a transport", () => {
    expect(() => createServer()).not.toThrow();
    const server = createServer();
    expect(server.isConnected()).toBe(false);
  });
});
