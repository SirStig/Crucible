# CanvasLoop

Grounded generate → check → fix loops for AI-agent-produced game craft, instead
of leaving "make it better" to vague prompting. See
[`canvasloop-prd-trd.md`](./canvasloop-prd-trd.md) for the full product/technical
spec, covering both craft tracks.

This repo currently implements **Track B — Prose Craft Loop**, both tiers:

- **Tier 1** (deterministic, no model calls): AI-tell phrasing, templated
  "balanced-contrast" constructions, uniform sentence rhythm, said-bookisms,
  adjacent-line redundancy, document-wide word-repetition-overuse, and
  (when a style profile is supplied) voice-vocabulary mismatches.
- **Tier 2** (model-assisted, no model call embedded in the server — the
  calling agent applies the judgment): self-justifying/over-explaining
  prose, on-the-nose dialogue, exposition dumps, and voice consistency.
- **FR18 style profiles**: per-character/per-project voice targets, always
  project-supplied — there is no bundled default register.

Plus export into Ink, Yarn Spinner, JSON, and `.strings`-style formats.
Track A (the visual/pixel-art craft loop) is scoped in the PRD/TRD but not
yet built.

See [`packages/prose/RESEARCH.md`](./packages/prose/RESEARCH.md) for what
each check is actually grounded in — cited sources, what was deliberately
excluded and why, and honest validation status against real production text.

## Packages

| Package                                           | What it is                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`@canvasloop/core`](./packages/core)             | Track-agnostic shared types and the generate → check → fix loop controller.                                             |
| [`@canvasloop/prose`](./packages/prose)           | The Track B rubric engine: Tier 1 detectors, Tier 2 rubric library, style profiles, living-data files, export adapters. |
| [`@canvasloop/mcp-server`](./packages/mcp-server) | MCP server exposing the five prose tools over stdio.                                                                    |
| [`@canvasloop/cli`](./packages/cli)               | The `canvasloop` command-line tool (Tier 1 only — Tier 2 needs an agent).                                               |

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
```

Input files use a simple `Speaker: line text` convention — the speaker
prefix is optional per line, so plain prose/UI strings work too.

### MCP server

```sh
node packages/mcp-server/dist/index.js
```

Registers five tools:

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

### Living data & style profiles

`packages/prose/data/ai-tell-phrases.json`, `said-bookisms.json`, and
`craft-rubric.json` are meant to be edited directly, or overridden per-call
via `--phrases-file`/`--bookisms-file` (CLI) or the equivalent MCP tool
options, rather than forking the package.

Style profiles (FR18) are always project-supplied — there's no bundled
default, since the point is not pushing every project toward one generic
register. Copy `packages/prose/data/example-style-profiles.json` into your
own project, edit it to match your actual cast, and point
`--style-profiles-file`/`options.styleProfilesFile` at it.
