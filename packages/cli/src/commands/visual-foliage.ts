import { writeFileSync } from "node:fs";
import type { LSystemSpec } from "@canvasloop/visual";
import { generateFoliagePreset } from "@canvasloop/visual";

export interface VisualFoliageCommandOptions {
  preset: string;
  out: string;
  iterations?: number;
  angleDegrees?: number;
  stepLength?: number;
}

export function runVisualFoliageCommand(options: VisualFoliageCommandOptions): void {
  const overrides: Partial<LSystemSpec> = {};
  if (options.iterations !== undefined) overrides.iterations = options.iterations;
  if (options.angleDegrees !== undefined) overrides.angleDegrees = options.angleDegrees;
  if (options.stepLength !== undefined) overrides.stepLength = options.stepLength;

  const result = generateFoliagePreset(options.preset, overrides);
  writeFileSync(options.out, result.svg, "utf-8");
}
