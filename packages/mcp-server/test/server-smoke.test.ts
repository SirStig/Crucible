import { describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGradeProsePatternTool } from "../src/tools/grade-prose-pattern.js";
import { registerIterateProseTool } from "../src/tools/iterate-prose.js";
import { registerGetProseCraftRubricTool } from "../src/tools/get-prose-craft-rubric.js";
import { registerGradeProseCraftTool } from "../src/tools/grade-prose-craft.js";
import { registerGetStyleProfileTool } from "../src/tools/get-style-profile.js";
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

  it("registers get_prose_craft_rubric as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGetProseCraftRubricTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("grade_prose_craft");
  });

  it("registers grade_prose_craft as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGradeProseCraftTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("get_prose_craft_rubric");
  });

  it("registers get_style_profile as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGetStyleProfileTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("FR18");
  });

  it("createServer wires up all five tools without throwing or connecting a transport", () => {
    expect(() => createServer()).not.toThrow();
    const server = createServer();
    expect(server.isConnected()).toBe(false);
  });
});
