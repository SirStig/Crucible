import { Command, InvalidArgumentError, Option } from "commander";
import { runGradeCommand, type GradeCommandOptions } from "./commands/grade.js";
import { runExportCommand, type ExportCommandOptions } from "./commands/export.js";
import {
  runVisualRenderCommand,
  type VisualRenderCommandOptions,
} from "./commands/visual-render.js";
import { runVisualGradeCommand, type VisualGradeCommandOptions } from "./commands/visual-grade.js";
import {
  runVisualFoliageCommand,
  type VisualFoliageCommandOptions,
} from "./commands/visual-foliage.js";
import { runVisualSheetCommand, type VisualSheetCommandOptions } from "./commands/visual-sheet.js";
import { FOLIAGE_PRESETS } from "../visual/index.js";
import { startServer } from "../mcp/index.js";
import { VERSION } from "../version.js";

const EXPORT_FORMATS = ["ink", "yarn", "json", "strings"] as const;

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`Expected a positive integer, got "${value}".`);
  }
  return parsed;
}

function parsePositiveFloat(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new InvalidArgumentError(`Expected a positive number, got "${value}".`);
  }
  return parsed;
}

export function createProgram(): Command {
  const program = new Command();
  program
    .name("crucible")
    .description("Crucible: grounded generate-check-fix loops for AI-agent game content.")
    .version(VERSION);

  program
    .command("mcp")
    .description("Start the MCP server on stdio (for Claude Code and other MCP clients)")
    .action(async () => {
      await startServer();
    });

  const prose = program
    .command("prose")
    .description("Track B: Prose Craft Loop (Tier 1, no model calls)");

  prose
    .command("grade")
    .description("Grade a dialogue/prose file against the Tier 1 pattern rubric")
    .argument(
      "<file>",
      'path to a file using the "Speaker: line text" convention (speaker optional)',
    )
    .option("--json", "print machine-readable JSON instead of a human-readable report")
    .option(
      "--min-sentences-for-rhythm <n>",
      "minimum pooled sentences before the rhythm check runs (default 4)",
      parsePositiveInt,
    )
    .option(
      "--target-cv <n>",
      "coefficient-of-variation floor for the rhythm check (default 0.35)",
      parsePositiveFloat,
    )
    .option(
      "--min-tokens-for-redundancy <n>",
      "minimum content tokens before a line pair is compared for redundancy (default 3)",
      parsePositiveInt,
    )
    .option(
      "--redundancy-threshold <n>",
      "Jaccard similarity at/above which adjacent lines are flagged as redundant (default 0.6)",
      parsePositiveFloat,
    )
    .option("--phrases-file <path>", "override the bundled ai-tell-phrases.json living-data file")
    .option("--bookisms-file <path>", "override the bundled said-bookisms.json living-data file")
    .option(
      "--min-lines-for-repetition <n>",
      "document must have at least this many lines before the word-repetition check runs (default 6)",
      parsePositiveInt,
    )
    .option(
      "--min-occurrence-lines <n>",
      "a word must appear in at least this many distinct lines to be flagged (default 4)",
      parsePositiveInt,
    )
    .option(
      "--repetition-line-ratio <n>",
      "a word must appear in at least this fraction of lines to be flagged (default 0.35)",
      parsePositiveFloat,
    )
    .option(
      "--style-profiles-file <path>",
      "path to a project's own style-profile file (no bundled default; see data/example-style-profiles.json)",
    )
    .option(
      "--style-profile-id <id>",
      "which profile in --style-profiles-file to grade against (falls back to that file's defaultProfile)",
    )
    .action((file: string, options: GradeCommandOptions) => {
      const { exitCode, output } = runGradeCommand(file, options);
      console.log(output);
      process.exitCode = exitCode;
    });

  prose
    .command("export")
    .description(
      "Export a dialogue/prose file to Ink, Yarn Spinner, JSON, or a .strings-style format",
    )
    .argument(
      "<file>",
      'path to a file using the "Speaker: line text" convention (speaker optional)',
    )
    .addOption(
      new Option("--format <format>", "export format")
        .choices(EXPORT_FORMATS)
        .makeOptionMandatory(),
    )
    .requiredOption("--out <path>", "output file path")
    .option("--node <name>", "Yarn node title, yarn format only (default CrucibleExport)")
    .action((file: string, options: ExportCommandOptions) => {
      runExportCommand(file, options);
      console.log(`Wrote ${options.out}`);
    });

  const visual = program
    .command("visual")
    .description("Track A: Visual Craft Loop (Tier 1, no model calls)");

  visual
    .command("render")
    .description("Render a sprite's SVG to a PNG at an exact pixel grid size")
    .argument("<file>", "path to an SVG file")
    .requiredOption(
      "--grid-width <n>",
      "declared pixel-grid width (becomes the render width)",
      parsePositiveInt,
    )
    .requiredOption(
      "--grid-height <n>",
      "declared pixel-grid height (becomes the render height)",
      parsePositiveInt,
    )
    .requiredOption("--out <path>", "output PNG file path")
    .action((file: string, options: VisualRenderCommandOptions) => {
      runVisualRenderCommand(file, options);
      console.log(`Wrote ${options.out}`);
    });

  visual
    .command("grade")
    .description("Grade a sprite's SVG against the Tier 1 pixel-art rubric")
    .argument("<file>", "path to an SVG file")
    .requiredOption("--grid-width <n>", "declared pixel-grid width", parsePositiveInt)
    .requiredOption("--grid-height <n>", "declared pixel-grid height", parsePositiveInt)
    .option("--json", "print machine-readable JSON instead of a human-readable report")
    .option(
      "--min-region-size-for-banding <n>",
      "same-color regions smaller than this (px) are ignored by the banding check (default 4)",
      parsePositiveInt,
    )
    .option(
      "--banding-elongation-threshold <n>",
      "bounding-box aspect ratio a region must clear to count as strip-like (default 3)",
      parsePositiveFloat,
    )
    .option(
      "--min-diagonal-run-for-jaggies <n>",
      "a diagonal run shorter than this (columns) isn't judged for jaggies (default 4)",
      parsePositiveInt,
    )
    .option(
      "--jaggies-tread-cv <n>",
      "coefficient-of-variation floor for tread lengths within a diagonal run (default 0.35)",
      parsePositiveFloat,
    )
    .option(
      "--dither-max-transition-width <n>",
      "a dither region's narrow-dimension width (px) above this reads as covering a field (default 3)",
      parsePositiveFloat,
    )
    .option(
      "--outline-inconsistency-ratio <n>",
      "fraction of the contour allowed to deviate from the dominant border color (default 0.15)",
      parsePositiveFloat,
    )
    .option(
      "--color-cluster-distance <n>",
      "redmean perceptual distance below which two colors merge into one cluster (default 24)",
      parsePositiveFloat,
    )
    .option(
      "--color-count-ratio <n>",
      "unique/effective palette-size ratio above which too-many-similar-colors fires (default 1.5)",
      parsePositiveFloat,
    )
    .option(
      "--max-fragment-size-ratio <n>",
      "a stray component smaller than this fraction of the main body's pixel count is a candidate unattached fragment (default 0.15)",
      parsePositiveFloat,
    )
    .option(
      "--max-attachment-gap <n>",
      "a stray component farther than this (px) from the main body isn't flagged as unattached (default 4)",
      parsePositiveFloat,
    )
    .option(
      "--max-unintended-hole-size <n>",
      "an enclosed transparent region larger than this (px) isn't flagged as an unintended hole (default 3)",
      parsePositiveInt,
    )
    .action((file: string, options: VisualGradeCommandOptions) => {
      const { exitCode, output } = runVisualGradeCommand(file, options);
      console.log(output);
      process.exitCode = exitCode;
    });

  visual
    .command("foliage")
    .description("Generate procedural foliage SVG from a named L-system preset")
    .addOption(
      new Option("--preset <name>", "foliage preset")
        .choices(Object.keys(FOLIAGE_PRESETS))
        .makeOptionMandatory(),
    )
    .requiredOption("--out <path>", "output SVG file path")
    .option("--iterations <n>", "override the preset's L-system iteration count", parsePositiveInt)
    .option("--angle-degrees <n>", "override the preset's turtle turn angle", parsePositiveFloat)
    .option("--step-length <n>", "override the preset's turtle step length", parsePositiveFloat)
    .action((options: VisualFoliageCommandOptions) => {
      runVisualFoliageCommand(options);
      console.log(`Wrote ${options.out}`);
    });

  visual
    .command("sheet")
    .description("Pack multiple sprite frames (listed in a JSON manifest) into one sprite sheet")
    .argument("<manifest>", 'JSON file: [{ "file", "gridWidth", "gridHeight", "name"? }, ...]')
    .requiredOption("--out <path>", "output sheet PNG file path")
    .requiredOption("--columns <n>", "number of columns in the packed sheet", parsePositiveInt)
    .action((manifest: string, options: VisualSheetCommandOptions) => {
      runVisualSheetCommand(manifest, options);
      console.log(`Wrote ${options.out}`);
    });

  return program;
}
