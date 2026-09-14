import { describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerGradeProsePatternTool } from "../src/tools/grade-prose-pattern.js";
import { registerIterateProseTool } from "../src/tools/iterate-prose.js";
import { registerGetProseCraftRubricTool } from "../src/tools/get-prose-craft-rubric.js";
import { registerGradeProseCraftTool } from "../src/tools/grade-prose-craft.js";
import { registerGetStyleProfileTool } from "../src/tools/get-style-profile.js";
import { registerRenderSpriteTool } from "../src/tools/render-sprite.js";
import { registerGradeSpritePatternTool } from "../src/tools/grade-sprite-pattern.js";
import { registerIterateSpriteTool } from "../src/tools/iterate-sprite.js";
import { registerGetSpriteCraftRubricTool } from "../src/tools/get-sprite-craft-rubric.js";
import { registerGradeSpriteCraftTool } from "../src/tools/grade-sprite-craft.js";
import { registerGenerateFoliageTool } from "../src/tools/generate-foliage.js";
import { registerPackSpriteSheetTool } from "../src/tools/pack-sprite-sheet.js";
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
    expect(tool.description).toContain("voice profile");
  });

  it("registers render_sprite as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerRenderSpriteTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("grade_sprite_pattern");
  });

  it("registers grade_sprite_pattern as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGradeSpritePatternTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("no-model-call");
  });

  it("registers iterate_sprite as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerIterateSpriteTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("sessionId");
  });

  it("registers get_sprite_craft_rubric as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGetSpriteCraftRubricTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("grade_sprite_craft");
  });

  it("registers grade_sprite_craft as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGradeSpriteCraftTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("get_sprite_craft_rubric");
  });

  it("registers generate_foliage as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerGenerateFoliageTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("Lindenmayer");
  });

  it("registers pack_sprite_sheet as an enabled tool with a description", () => {
    const server = new McpServer({ name: "test", version: "0.0.0" });
    const tool = registerPackSpriteSheetTool(server);
    expect(tool.enabled).toBe(true);
    expect(tool.description).toContain("sheet PNG");
  });

  it("createServer wires up all twelve tools without throwing or connecting a transport", () => {
    expect(() => createServer()).not.toThrow();
    const server = createServer();
    expect(server.isConnected()).toBe(false);
  });
});
