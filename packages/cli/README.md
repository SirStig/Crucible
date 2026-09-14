# @canvasloop/cli

Command-line access to [CanvasLoop](https://github.com/SirStig/CanvasLoop)'s
Tier 1 craft checks. Useful in CI, or for a quick spot-check without starting
an agent.

```sh
npx @canvasloop/cli prose grade scene.txt
```

```sh
canvasloop prose grade scene.txt --json
canvasloop prose export scene.txt --format yarn --out scene.yarn

canvasloop visual render sprite.svg --grid-width 16 --grid-height 16 --out sprite.png
canvasloop visual grade sprite.svg --grid-width 16 --grid-height 16
canvasloop visual foliage --preset fern --iterations 4 --out foliage.svg
canvasloop visual sheet manifest.json --out sheet.png
```

`grade` exits non-zero when a check fails, so it drops straight into a CI step.

Tier 1 only. Tier 2 needs an agent to apply judgment against a named rubric
item, which is what the
[MCP server](https://www.npmjs.com/package/@canvasloop/mcp-server) is for.

Requires Node 22.12 or newer. MIT licensed.
