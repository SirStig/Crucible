# crucible

Command-line access to [Crucible](https://github.com/SirStig/Crucible)'s
Tier 1 craft checks. Useful in CI, or for a quick spot-check without starting
an agent.

```sh
npx crucible prose grade scene.txt
```

```sh
crucible prose grade scene.txt --json
crucible prose export scene.txt --format yarn --out scene.yarn

crucible visual render sprite.svg --grid-width 16 --grid-height 16 --out sprite.png
crucible visual grade sprite.svg --grid-width 16 --grid-height 16
crucible visual foliage --preset fern --iterations 4 --out foliage.svg
crucible visual sheet manifest.json --out sheet.png
```

`grade` exits non-zero when a check fails, so it drops straight into a CI step.

Tier 1 only. Tier 2 needs an agent to apply judgment against a named rubric
item, which is what the
[MCP server](https://www.npmjs.com/package/crucible-mcp-server) is for.

Requires Node 22.12 or newer. MIT licensed.
