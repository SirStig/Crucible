# CanvasLoop

Grounded generate → check → fix loops for AI-agent-produced game craft, instead
of leaving "make it better" to vague prompting. See
[`canvasloop-prd-trd.md`](./canvasloop-prd-trd.md) for the full product/technical
spec, covering both craft tracks.

Both tracks are built, both with two tiers:

- **Tier 1** (deterministic, no model calls) — pattern-matching that catches
  a class of problem outright. This is necessary but not sufficient: passing
  Tier 1 means the content is _clean_, not that it's actually _good_.
- **Tier 2** (model-assisted, no model call embedded in the server) — named
  craft-rubric items with a `get_*_craft_rubric` tool that hands the calling
  agent one item's definition (and, for Track A, the rendered image) and a
  `grade_*_craft` tool that structures the agent's own judgment call into a
  Finding. CanvasLoop itself never calls a model — the agent already in the
  loop applies the rubric using its own judgment, which is what keeps the
  server free and self-hostable.

**Track B — Prose Craft Loop** (dialogue/UI text):

- Tier 1: AI-tell phrasing, templated "balanced-contrast" constructions,
  uniform sentence rhythm, said-bookisms, adjacent-line redundancy,
  document-wide word-repetition-overuse, and (when a style profile is
  supplied) voice-vocabulary mismatches.
- Tier 2: self-justifying/over-explaining prose, on-the-nose dialogue,
  exposition dumps, and voice consistency.
- **FR18 style profiles**: per-character/per-project voice targets, always
  project-supplied — there is no bundled default register.
- Export into Ink, Yarn Spinner, JSON, and `.strings`-style formats.

See [`packages/prose/RESEARCH.md`](./packages/prose/RESEARCH.md) for what
each check is actually grounded in — cited sources, what was deliberately
excluded and why, and honest validation status against real production text.

**Track A — Visual Craft Loop** (code-drawn pixel-art sprites/tiles/foliage):

- Renders SVG sprite source to an exact pixel grid (1 SVG unit = 1 pixel,
  crisp edges, no anti-aliasing) via `@resvg/resvg-js`, so every check
  operates on the rasterized pixel buffer, not the source markup.
- Tier 1: canvas/bounding-box structural sanity, banding (parallel
  same-value strips instead of real shading), jaggies (irregular staircase
  edges), dithering overuse, outline-color inconsistency,
  too-many-similar-colors (redmean perceptual clustering), unattached
  fragments (a piece that should be touching the main body but isn't —
  attachment errors), and unintended holes (a stray gap sealed inside a
  silhouette).
- Tier 2: pillow shading, cross-sprite light-source consistency, hue
  shifting in shadow/highlight, selective outlining, silhouette
  readability, value contrast/range, and shape/proportion plausibility —
  the checks that actually decide whether art _looks_ good, not just
  whether it's clean. See
  [`packages/visual/RESEARCH.md`](./packages/visual/RESEARCH.md) for the
  grounding and honest limitations of each one.
- An L-system (Lindenmayer) foliage generator with a few named presets, and
  a sprite-sheet grid-packing helper.

## Packages

| Package                                           | What it is                                                                                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`@canvasloop/core`](./packages/core)             | Track-agnostic shared types and the generate → check → fix loop controller.                                                   |
| [`@canvasloop/prose`](./packages/prose)           | The Track B rubric engine: Tier 1 detectors, Tier 2 rubric library, style profiles, living-data files, export adapters.       |
| [`@canvasloop/visual`](./packages/visual)         | The Track A rubric engine: SVG renderer, structural grader, Tier 1 detectors, Tier 2 rubric library, foliage & sheet helpers. |
| [`@canvasloop/mcp-server`](./packages/mcp-server) | MCP server exposing all twelve tools (both tracks, both tiers) over stdio.                                                    |
| [`@canvasloop/cli`](./packages/cli)               | The `canvasloop` command-line tool (Tier 1 only — Tier 2 needs an agent to apply judgment).                                   |

## Getting started

```sh
npm install
npm run build
npm test
```

### CLI

```sh
canvasloop prose grade path/to/scene.txt
canvasloop prose grade path/to/scene.txt --json
canvasloop prose grade path/to/scene.txt --style-profiles-file my-profiles.json --style-profile-id marta
canvasloop prose export path/to/scene.txt --format yarn --out scene.yarn

canvasloop visual render sprite.svg --grid-width 16 --grid-height 16 --out sprite.png
canvasloop visual grade sprite.svg --grid-width 16 --grid-height 16
canvasloop visual foliage --preset fern --iterations 4 --out foliage.svg
canvasloop visual sheet manifest.json --out sheet.png
```

Prose input files use a simple `Speaker: line text` convention — the
speaker prefix is optional per line, so plain prose/UI strings work too.
Visual input is arbitrary SVG markup; the declared grid width/height becomes
the render size, so 1 SVG unit = 1 pixel regardless of how the shapes are
drawn (rects, paths, curves).

### MCP server

```sh
node packages/mcp-server/dist/index.js
```

Registers twelve tools.

**Track B (prose):**

- **`grade_prose_pattern`** — grades a block of text against the Tier 1
  rubric and returns a structured pass/warn/fail result with named findings.
- **`iterate_prose`** — the same grading, plus per-`sessionId` iteration
  tracking, a line diff against the previous call, a max-iteration cutoff,
  and (via `craftFindings`) folding Tier 2 verdicts into the same session.
- **`get_prose_craft_rubric`** — fetches one (or all) Tier 2 rubric item
  definitions for the calling agent to apply itself.
- **`grade_prose_craft`** — records the agent's own Tier 2 verdict,
  structuring it into a Finding.
- **`get_style_profile`** — fetches a character/project voice profile
  (FR18) from a project-supplied file, mainly to ground the
  `voice-consistency` Tier 2 item.

**Track A (visual):**

- **`render_sprite`** — renders SVG to a pixel-exact PNG (image content
  block) with basic dimension/bounding-box info. No grading.
- **`grade_sprite_pattern`** — renders and grades against the Tier 1 rubric,
  returning the rendered image alongside a structured pass/warn/fail result.
- **`iterate_sprite`** — the same grading, plus per-`sessionId` iteration
  tracking, a diff of the SVG source lines against the previous call, a
  max-iteration cutoff, and (via `craftFindings`) folding Tier 2 verdicts
  into the same session.
- **`get_sprite_craft_rubric`** — fetches one (or all) Tier 2 rubric item
  definitions for the calling agent to apply itself against the rendered
  image (fetch that first via `render_sprite`/`grade_sprite_pattern`).
- **`grade_sprite_craft`** — records the agent's own Tier 2 verdict
  (optionally with x/y pixel coordinates), structuring it into a Finding.
- **`generate_foliage`** — expands an L-system spec (or a named preset)
  into SVG.
- **`pack_sprite_sheet`** — lays out multiple rendered frames into one
  grid-aligned sheet PNG plus frame metadata.

### Living data & style profiles

`packages/prose/data/*.json` and `packages/visual/data/craft-rubric.json`
are meant to be edited directly, or overridden per-call via
`--phrases-file`/`--bookisms-file` (CLI) or the equivalent MCP tool options,
rather than forking the package.

Style profiles (FR18) are always project-supplied — there's no bundled
default, since the point is not pushing every project toward one generic
register. Copy `packages/prose/data/example-style-profiles.json` into your
own project, edit it to match your actual cast, and point
`--style-profiles-file`/`options.styleProfilesFile` at it.
