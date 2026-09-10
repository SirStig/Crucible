import { Command, InvalidArgumentError, Option } from "commander";
import { runGradeCommand, type GradeCommandOptions } from "./commands/grade.js";
import { runExportCommand, type ExportCommandOptions } from "./commands/export.js";

const CLI_VERSION = "0.1.0";
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
    .name("canvasloop")
    .description("CanvasLoop — grounded generate-check-fix loops for AI-agent game content.")
    .version(CLI_VERSION);

  const prose = program.command("prose").description("Track B: Prose Craft Loop (Tier 1, no model calls)");

  prose
    .command("grade")
    .description("Grade a dialogue/prose file against the Tier 1 pattern rubric")
    .argument("<file>", "path to a file using the \"Speaker: line text\" convention (speaker optional)")
    .option("--json", "print machine-readable JSON instead of a human-readable report")
    .option(
      "--min-sentences-for-rhythm <n>",
      "minimum pooled sentences before the rhythm check runs (default 4)",
      parsePositiveInt,
    )
    .option("--target-cv <n>", "coefficient-of-variation floor for the rhythm check (default 0.35)", parsePositiveFloat)
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
    .action((file: string, options: GradeCommandOptions) => {
      const { exitCode, output } = runGradeCommand(file, options);
      console.log(output);
      process.exitCode = exitCode;
    });

  prose
    .command("export")
    .description("Export a dialogue/prose file to Ink, Yarn Spinner, JSON, or a .strings-style format")
    .argument("<file>", "path to a file using the \"Speaker: line text\" convention (speaker optional)")
    .addOption(
      new Option("--format <format>", "export format").choices(EXPORT_FORMATS).makeOptionMandatory(),
    )
    .requiredOption("--out <path>", "output file path")
    .option("--node <name>", "Yarn node title, yarn format only (default CanvasLoopExport)")
    .action((file: string, options: ExportCommandOptions) => {
      runExportCommand(file, options);
      console.log(`Wrote ${options.out}`);
    });

  return program;
}
