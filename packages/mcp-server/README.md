# crucible-mcp-server

The [Crucible](https://github.com/SirStig/Crucible) MCP server. Exposes both
craft tracks over stdio to Claude Code or any other MCP client.

Register it in whichever project you want it available in:

```sh
claude mcp add --scope project crucible -- npx -y crucible-mcp-server
```

`--scope project` writes a `.mcp.json` into your game's repo so it's there for
anyone who checks it out. Use `--scope user` to get it in every project instead.

**Prose tools:** `grade_prose_pattern`, `iterate_prose`, `get_prose_craft_rubric`,
`grade_prose_craft`, `get_style_profile`

**Visual tools:** `render_sprite`, `grade_sprite_pattern`, `iterate_sprite`,
`get_sprite_craft_rubric`, `grade_sprite_craft`, `generate_foliage`,
`pack_sprite_sheet`

Registering the server only makes the tools available. It doesn't make an agent
reach for them. Add a project `CLAUDE.md` telling yours when to grade, and to
apply the Tier 2 rubric rather than stopping at Tier 1.

Requires Node 22.12 or newer. MIT licensed.
