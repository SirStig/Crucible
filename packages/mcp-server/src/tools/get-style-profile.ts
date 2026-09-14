import { z } from "zod";
import type { McpServer, RegisteredTool } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadStyleProfileData } from "@canvasloop/prose";
import { styleProfileEntrySchema } from "../schemas.js";

const inputShape = {
  profilesFile: z.string().min(1),
  profileId: z.string().optional(),
};

export interface GetStyleProfileInput {
  profilesFile: string;
  profileId?: string | undefined;
}

/**
 * Reads a project's own style-profile file. There is no bundled default; see
 * data/example-style-profiles.json for the documented shape. Mainly meant
 * for the voice-consistency Tier 2 rubric item: an agent fetches the target
 * character's profile here before judging whether a line matches it.
 */
export function getStyleProfileHandler(input: GetStyleProfileInput) {
  const data = loadStyleProfileData(input.profilesFile);

  if (input.profileId !== undefined) {
    const match = data.profiles.filter((profile) => profile.id === input.profileId);
    if (match.length === 0) {
      throw new Error(
        `CanvasLoop: no style profile named "${input.profileId}" in ${input.profilesFile}. Call get_style_profile with no profileId to list what's available.`,
      );
    }
    const output = { profiles: match, defaultProfile: data.defaultProfile ?? null };
    return {
      content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      structuredContent: output,
    };
  }

  const output = { profiles: data.profiles, defaultProfile: data.defaultProfile ?? null };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    structuredContent: output,
  };
}

export function registerGetStyleProfileTool(server: McpServer): RegisteredTool {
  return server.registerTool(
    "get_style_profile",
    {
      title: "Fetch a project's style/voice profile",
      description:
        "Reads a character or project voice profile from a project-supplied file (register, verbosity, vocabulary to favor or avoid, free-form voice notes). It is used mainly to ground the voice-consistency Tier 2 rubric item before judging whether a line matches a character's established voice. There is no bundled default profile; profilesFile must point at the calling project's own file.",
      inputSchema: inputShape,
      outputSchema: {
        profiles: z.array(styleProfileEntrySchema),
        defaultProfile: z.string().nullable(),
      },
    },
    getStyleProfileHandler,
  );
}
