# CanvasLoop

CanvasLoop closes the loop on AI-agent-generated game content. An agent
writes dialogue or draws a sprite, and normally that's it — nobody checks
whether it's actually good, because "make it better" isn't something a
model can act on. CanvasLoop turns that into: generate → check against
named, citable craft knowledge → get a specific fix → regenerate.

It never calls a model itself. Tier 1 checks are deterministic pattern
matching (no model call, no API key, fully self-hostable). Tier 2 checks
hand the calling agent — the one already in your loop — a named rubric
item and let it apply real judgment, then structure that verdict into a
finding. Two tracks:

| Track                                    | Grades                                      | Tier 1                                                                                                                      | Tier 2                                                                                                                                             |
| ---------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B — Prose** (dialogue, UI text)        | Plain text, `Speaker: line` or bare lines   | AI-tell phrasing, said-bookisms, uniform sentence rhythm, redundancy, word repetition                                       | Self-justifying/over-explaining, on-the-nose dialogue, exposition dumps, voice consistency                                                         |
| **A — Visual** (pixel-art sprites/tiles) | SVG source, rendered to an exact pixel grid | Banding, jaggies, dithering overuse, outline inconsistency, too-many-similar-colors, unattached fragments, unintended holes | Pillow shading, light-source consistency, hue shifting, selective outlining, silhouette readability, value contrast, shape/proportion plausibility |

**Why Tier 2 exists, concretely:** a sprite can pass every Tier 1 check —
no accidental defects, structurally clean — and still be bad art: flat,
no light source, an unused palette color. Tier 1 only proves _clean_.
Tier 2 is what catches _good_. Both tracks' `RESEARCH.md` document a real
case where Tier 1 passed on genuinely weak content and Tier 2 is what
actually caught it — see
[`packages/prose/RESEARCH.md`](./packages/prose/RESEARCH.md) and
[`packages/visual/RESEARCH.md`](./packages/visual/RESEARCH.md).

## Install

```sh
git clone <this repo>
cd CanvasLoop
npm install
npm run build
```

## Use it from Claude Code (or any MCP client)

Register the server, scoped to whichever project you want it available in:

```sh
cd /path/to/your-game
claude mcp add --scope project canvasloop -- node /path/to/CanvasLoop/packages/mcp-server/dist/index.js
```

`--scope project` writes a `.mcp.json` in your game's repo, so it's there
for anyone who checks it out. Use `--scope user` instead if you want it
available in every project regardless of repo. Either way, a fresh Claude
Code session in that directory will prompt a one-time approval, then all
twelve tools are available.

Registering the server only makes the tools _available_ — it doesn't make
an agent reach for them. Add a project `CLAUDE.md` telling it when to:
grade dialogue before calling it done, apply the Tier 2 rubric (not just
Tier 1), and — if your art pipeline isn't SVG-native — translate to SVG,
grade, then port the fix back to your real source.

## Use it standalone

```sh
node packages/mcp-server/dist/index.js
```

Any MCP client can talk to it over stdio — Claude Code is one option, not
a requirement.

## Use the CLI (Tier 1 only)

Tier 2 needs an agent to apply judgment, so the CLI only covers Tier 1 —
useful for CI or a quick spot-check without spinning up an agent.

```sh
canvasloop prose grade scene.txt
canvasloop prose grade scene.txt --json
canvasloop prose grade scene.txt --style-profiles-file profiles.json --style-profile-id marta
canvasloop prose export scene.txt --format yarn --out scene.yarn

canvasloop visual render sprite.svg --grid-width 16 --grid-height 16 --out sprite.png
canvasloop visual grade sprite.svg --grid-width 16 --grid-height 16
canvasloop visual foliage --preset fern --iterations 4 --out foliage.svg
canvasloop visual sheet manifest.json --out sheet.png
```

Prose input is plain text; a `Speaker:` prefix per line is optional, so
bare UI strings work too. Visual input is arbitrary SVG — the declared
grid width/height becomes the render size (1 SVG unit = 1 pixel), so it
doesn't matter whether the SVG is one `<rect>` per pixel or paths/curves.

## MCP tools

**Prose:**

| Tool                     | Does                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grade_prose_pattern`    | Grades text against Tier 1; returns pass/warn/fail with named findings.                                                                               |
| `iterate_prose`          | Same, plus per-session iteration tracking, a line diff vs. the last call, a max-iteration cutoff, and folding in Tier 2 verdicts via `craftFindings`. |
| `get_prose_craft_rubric` | Returns one (or all) Tier 2 rubric item definitions for you to apply yourself.                                                                        |
| `grade_prose_craft`      | Records your Tier 2 verdict as a structured finding.                                                                                                  |
| `get_style_profile`      | Fetches a character/project voice profile from a project-supplied file.                                                                               |

**Visual:**

| Tool                      | Does                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `render_sprite`           | Renders SVG to a pixel-exact PNG. No grading.                                                                                                   |
| `grade_sprite_pattern`    | Renders and grades against Tier 1; returns the image plus pass/warn/fail with named findings.                                                   |
| `iterate_sprite`          | Same, plus per-session iteration tracking, an SVG-source-line diff, a max-iteration cutoff, and folding in Tier 2 verdicts via `craftFindings`. |
| `get_sprite_craft_rubric` | Returns one (or all) Tier 2 rubric item definitions for you to apply against the rendered image.                                                |
| `grade_sprite_craft`      | Records your Tier 2 verdict (optionally with x/y coordinates) as a structured finding.                                                          |
| `generate_foliage`        | Expands an L-system spec or named preset into SVG.                                                                                              |
| `pack_sprite_sheet`       | Lays out multiple rendered frames into one grid-aligned sheet PNG plus frame metadata.                                                          |

## Customizing the rubrics

`packages/prose/data/*.json` and `packages/visual/data/craft-rubric.json`
are meant to be edited directly, or overridden per-call
(`--phrases-file`/`--bookisms-file` on the CLI, the equivalent MCP tool
options) — fork the data, not the package.

Style profiles are always project-supplied; there's no bundled default,
since the point is not pushing every project toward one generic voice.
Copy `packages/prose/data/example-style-profiles.json` into your project,
edit it to your actual cast, and point `--style-profiles-file` /
`options.styleProfilesFile` at it.

## Packages

| Package                                           | What it is                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [`@canvasloop/core`](./packages/core)             | Track-agnostic shared types and the generate → check → fix loop controller.                              |
| [`@canvasloop/prose`](./packages/prose)           | Track B engine: Tier 1 detectors, Tier 2 rubric, style profiles, export adapters.                        |
| [`@canvasloop/visual`](./packages/visual)         | Track A engine: SVG renderer, structural grader, Tier 1 detectors, Tier 2 rubric, foliage/sheet helpers. |
| [`@canvasloop/mcp-server`](./packages/mcp-server) | MCP server exposing all twelve tools over stdio.                                                         |
| [`@canvasloop/cli`](./packages/cli)               | The `canvasloop` command-line tool.                                                                      |

## Development

```sh
npm test          # full suite across all packages
npx eslint .
npx prettier --check .
```
