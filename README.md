# CanvasLoop

Grounded generate → check → fix loops for AI-agent-produced game craft, instead
of leaving "make it better" to vague prompting. See
[`canvasloop-prd-trd.md`](./canvasloop-prd-trd.md) for the full product/technical
spec, covering both craft tracks.

This repo currently implements **Track B — Prose Craft Loop, v0.1 (Tier 1)**:
deterministic, no-model-call grading for game dialogue, quest text, and UI
copy — AI-tell phrasing, templated "balanced-contrast" constructions,
uniform sentence rhythm, said-bookisms, and adjacent-line redundancy — plus
export into Ink, Yarn Spinner, JSON, and `.strings`-style formats. Track A
(the visual/pixel-art craft loop) and Track B's Tier 2 (model-assisted
narrative rubric — on-the-nose dialogue, exposition dumps, voice
consistency) are scoped in the PRD/TRD but not yet built.

## Packages

| Package | What it is |
|---|---|
| [`@canvasloop/core`](./packages/core) | Track-agnostic shared types and the generate → check → fix loop controller. |
| [`@canvasloop/prose`](./packages/prose) | The Track B Tier 1 rubric engine: detectors, living-data phrase/bookism lists, export adapters. |
| [`@canvasloop/mcp-server`](./packages/mcp-server) | MCP server exposing `grade_prose_pattern` and `iterate_prose` over stdio. |
| [`@canvasloop/cli`](./packages/cli) | The `canvasloop` command-line tool. |

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
canvasloop prose export path/to/scene.txt --format yarn --out scene.yarn
```

Input files use a simple `Speaker: line text` convention — the speaker
prefix is optional per line, so plain prose/UI strings work too.

### MCP server

```sh
node packages/mcp-server/dist/index.js
```

Registers two tools:

- **`grade_prose_pattern`** — grades a block of text against the Tier 1
  rubric and returns a structured pass/warn/fail result with named findings.
- **`iterate_prose`** — the same grading, plus per-`sessionId` iteration
  tracking, a line diff against the previous call, and a max-iteration
  cutoff, so an agent can loop until the text actually passes without
  looping forever.

### Living data

`packages/prose/data/ai-tell-phrases.json` and `said-bookisms.json` are
meant to be edited directly as the phrases that read as machine-generated
drift over time — or point the CLI/MCP tools at your own copy via
`--phrases-file`/`--bookisms-file` (CLI) or `options.phrasesFile`/`bookismsFile`
(MCP tools) instead of forking the package.
