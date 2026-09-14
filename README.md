# Crucible

[![CI](https://github.com/SirStig/Crucible/actions/workflows/ci.yml/badge.svg)](https://github.com/SirStig/Crucible/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/crucible)](https://www.npmjs.com/package/crucible)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

Crucible grades game content an AI agent just produced, and tells it what to
fix. An agent writes dialogue or draws a sprite, and normally that's where it
ends, because "make it better" isn't an instruction a model can act on.
Crucible replaces that with a loop: generate, check against named craft
knowledge, get a specific fix, regenerate.

It never calls a model itself. Tier 1 checks are deterministic pattern matching,
so they need no API key and run anywhere. Tier 2 checks hand the calling agent
(the one already in your loop) a named rubric item, let it apply real judgment,
then record that verdict as a structured finding.

```console
$ crucible prose grade scene.txt
Crucible prose grade: scene.txt — WARN
  [WARN] (line 4) testament-to: "a testament to" reads as a stock AI-tell
         phrase (Promotional/editorializing construction.).
         fix: Cut the phrase, restate the connection plainly, or drop it.
  [INFO] (line 9) not-x-but-y: "not a warning, but a promise" is a templated
         balanced-contrast construction (Broad "not X, but Y" contrast.).
         fix: Cut the phrase, restate the connection plainly, or drop it.

  0 fail, 1 warn, 1 info — out of 12 line(s).
```

## Two tracks

**Track B: prose.** Dialogue and UI text, as plain text. A `Speaker:` prefix per
line is optional, so bare UI strings work too.

- Tier 1 catches AI-tell phrasing, said-bookisms, balanced-contrast templates,
  uniform sentence rhythm, adjacent-line redundancy, and word repetition.
- Tier 2 covers self-justifying dialogue, on-the-nose lines, exposition dumps,
  and voice consistency against a character profile.

**Track A: visual.** Pixel-art sprites and tiles, authored as SVG. The declared
grid size becomes the render size at one SVG unit per pixel, so it works whether
the source is one `<rect>` per pixel or paths and curves.

- Tier 1 catches banding, jaggies, dithering overuse, outline inconsistency,
  too-many-similar-colors, unattached fragments, and unintended holes.
- Tier 2 covers pillow shading, light-source consistency, hue shifting,
  selective outlining, silhouette readability, value contrast, and shape
  plausibility.

### Why Tier 2 exists

A sprite can pass every Tier 1 check and still be bad art: flat, no light
source, an unused palette color. Tier 1 only proves content is clean. Tier 2 is
what catches whether it's any good. Both tracks were built against real cases
where Tier 1 passed on genuinely weak content and only a Tier 2 item caught
it.

## Use it from Claude Code

Requires Node 22.12 or newer. Register the server in whichever project you want
it available in:

```sh
cd /path/to/your-game
claude mcp add --scope project crucible -- npx -y crucible-mcp-server
```

`--scope project` writes a `.mcp.json` into your game's repo, so it's there for
anyone who checks it out. Use `--scope user` to get it in every project instead.
Either way a fresh session in that directory prompts a one-time approval, and
then the tools are available.

Any MCP client can talk to the server over stdio. Claude Code is one option, not
a requirement:

```sh
npx -y crucible-mcp-server
```

Registering the server only makes the tools available. It doesn't make an agent
reach for them. Add a project `CLAUDE.md` telling yours when to grade dialogue
before calling it done, to apply the Tier 2 rubric rather than stopping at Tier
1, and, if your art pipeline isn't SVG-native, to translate to SVG, grade, then
port the fix back to your real source.

## Use the CLI

Tier 2 needs an agent to apply judgment, so the CLI covers Tier 1 only. It's for
CI, or a quick spot-check without starting an agent. `grade` exits non-zero on a
failing grade, so it drops straight into a CI step.

```sh
npx crucible prose grade scene.txt
```

```sh
crucible prose grade scene.txt --json
crucible prose grade scene.txt --style-profiles-file profiles.json --style-profile-id marta
crucible prose export scene.txt --format yarn --out scene.yarn

crucible visual render sprite.svg --grid-width 16 --grid-height 16 --out sprite.png
crucible visual grade sprite.svg --grid-width 16 --grid-height 16
crucible visual foliage --preset fern --iterations 4 --out foliage.svg
crucible visual sheet manifest.json --out sheet.png
```

## MCP tools

**Prose:**

| Tool                     | Does                                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grade_prose_pattern`    | Grades text against Tier 1, returning pass/warn/fail with named findings.                                                                            |
| `iterate_prose`          | Same, plus session iteration tracking, a line diff against the last call, a max-iteration cutoff, and Tier 2 verdicts folded in via `craftFindings`. |
| `get_prose_craft_rubric` | Returns one or all Tier 2 rubric items for you to apply yourself.                                                                                    |
| `grade_prose_craft`      | Records your Tier 2 verdict as a structured finding.                                                                                                 |
| `get_style_profile`      | Fetches a character or project voice profile from a project-supplied file.                                                                           |

**Visual:**

| Tool                      | Does                                                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `render_sprite`           | Renders SVG to a pixel-exact PNG. No grading.                                                                                         |
| `grade_sprite_pattern`    | Renders and grades against Tier 1, returning the image plus pass/warn/fail with named findings.                                       |
| `iterate_sprite`          | Same, plus session iteration tracking, an SVG-source diff, a max-iteration cutoff, and Tier 2 verdicts folded in via `craftFindings`. |
| `get_sprite_craft_rubric` | Returns one or all Tier 2 rubric items for you to apply against the rendered image.                                                   |
| `grade_sprite_craft`      | Records your Tier 2 verdict, optionally with x/y coordinates, as a structured finding.                                                |
| `generate_foliage`        | Expands an L-system spec or named preset into SVG.                                                                                    |
| `pack_sprite_sheet`       | Lays rendered frames into one grid-aligned sheet PNG plus frame metadata.                                                             |

## Customizing the rubrics

`packages/prose/data/*.json` and `packages/visual/data/craft-rubric.json` are
meant to be edited directly, or overridden per call with `--phrases-file` and
`--bookisms-file` on the CLI and their equivalents in the MCP tool options. Fork
the data, not the package.

Style profiles are always project-supplied. There's no bundled default, because
the point is not pushing every project toward one generic voice. Copy
`packages/prose/data/example-style-profiles.json` into your project, edit it to
your actual cast, and point `--style-profiles-file` or `options.styleProfilesFile`
at it.

## Packages

| Package                                        | What it is                                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`crucible-base`](./packages/core)             | Track-agnostic shared types and the generate/check/fix loop controller.                                      |
| [`crucible-prose`](./packages/prose)           | Track B engine: Tier 1 detectors, Tier 2 rubric, style profiles, export adapters.                            |
| [`crucible-visual`](./packages/visual)         | Track A engine: SVG renderer, structural grader, Tier 1 detectors, Tier 2 rubric, foliage and sheet helpers. |
| [`crucible-mcp-server`](./packages/mcp-server) | MCP server exposing both tracks' tools over stdio.                                                           |
| [`crucible`](./packages/cli)                   | The `crucible` command-line tool.                                                                            |

## Development

```sh
npm install
npm run build
npm test
npm run lint
npm run format:check
```

Contributions welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for what a new
detector or rubric item needs.

## License

MIT. See [LICENSE](./LICENSE).
