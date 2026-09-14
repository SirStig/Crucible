// Optional fields explicitly include `| undefined` for the same
// exactOptionalPropertyTypes reason documented on @canvasloop/prose's
// GradeOptions: a zod-parsed MCP tool input includes explicit `undefined`
// on omitted optional fields, not just an absent key.
export interface LSystemSpec {
  axiom: string;
  rules: Record<string, string>;
  iterations: number;
  angleDegrees: number;
  stepLength: number;
  startX?: number | undefined;
  startY?: number | undefined;
  /** Degrees, standard SVG convention (0 = right, 90 = down). Default -90 (pointing up). */
  startAngleDegrees?: number | undefined;
  strokeColor?: string | undefined;
  strokeWidth?: number | undefined;
}

export interface FoliageResult {
  svg: string;
  width: number;
  height: number;
}

const MAX_ITERATIONS = 10;
const MAX_EXPANDED_LENGTH = 500_000;

/** Standard L-system string rewriting: replace every symbol with its rule (symbols with no rule pass through unchanged). */
export function expandLSystem(
  axiom: string,
  rules: Record<string, string>,
  iterations: number,
): string {
  if (!Number.isInteger(iterations) || iterations < 0 || iterations > MAX_ITERATIONS) {
    throw new RangeError(
      `CanvasLoop: iterations must be an integer between 0 and ${MAX_ITERATIONS}.`,
    );
  }

  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of current) {
      next += rules[ch] ?? ch;
    }
    if (next.length > MAX_EXPANDED_LENGTH) {
      throw new RangeError(
        `CanvasLoop: L-system expansion exceeded ${MAX_EXPANDED_LENGTH} characters at iteration ${i + 1}. Reduce iterations or shorten the rules.`,
      );
    }
    current = next;
  }
  return current;
}

interface TurtleState {
  x: number;
  y: number;
  angle: number;
}

/**
 * Walks an expanded L-system string with a turtle: `F` draws forward and
 * advances, `+`/`-` turn by `angleDegrees`, `[`/`]` push/pop turtle state
 * (branching). Any other symbol is grammar-only (no turtle action), so the
 * usual L-system convention where e.g. `X` exists only to drive the rule
 * rewriting, not to draw anything itself.
 */
export function generateFoliageSvg(spec: LSystemSpec): FoliageResult {
  const expanded = expandLSystem(spec.axiom, spec.rules, spec.iterations);
  const strokeColor = spec.strokeColor ?? "#2d5a2d";
  const strokeWidth = spec.strokeWidth ?? 1;

  let x = spec.startX ?? 0;
  let y = spec.startY ?? 0;
  let angle = spec.startAngleDegrees ?? -90;
  const stack: TurtleState[] = [];
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  let minX = x;
  let maxX = x;
  let minY = y;
  let maxY = y;

  for (const ch of expanded) {
    switch (ch) {
      case "F": {
        const radians = (angle * Math.PI) / 180;
        const nextX = x + Math.cos(radians) * spec.stepLength;
        const nextY = y + Math.sin(radians) * spec.stepLength;
        segments.push({ x1: x, y1: y, x2: nextX, y2: nextY });
        x = nextX;
        y = nextY;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        break;
      }
      case "+":
        angle += spec.angleDegrees;
        break;
      case "-":
        angle -= spec.angleDegrees;
        break;
      case "[":
        stack.push({ x, y, angle });
        break;
      case "]": {
        const state = stack.pop();
        if (state) {
          x = state.x;
          y = state.y;
          angle = state.angle;
        }
        break;
      }
      default:
        break; // grammar-only symbol, no turtle action
    }
  }

  const padding = strokeWidth * 2 + 1;
  const width = Math.max(1, Math.ceil(maxX - minX + padding * 2));
  const height = Math.max(1, Math.ceil(maxY - minY + padding * 2));
  const offsetX = -minX + padding;
  const offsetY = -minY + padding;

  const lines = segments
    .map(
      (s) =>
        `<line x1="${(s.x1 + offsetX).toFixed(2)}" y1="${(s.y1 + offsetY).toFixed(2)}" x2="${(s.x2 + offsetX).toFixed(2)}" y2="${(s.y2 + offsetY).toFixed(2)}" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`,
    )
    .join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${lines}\n</svg>\n`;

  return { svg, width, height };
}

/** Named starting points so the agent doesn't have to invent L-system grammar from scratch. */
export const FOLIAGE_PRESETS: Record<string, LSystemSpec> = {
  fern: {
    axiom: "X",
    rules: { X: "F+[[X]-X]-F[-FX]+X", F: "FF" },
    iterations: 4,
    angleDegrees: 25,
    stepLength: 3,
  },
  bush: {
    axiom: "F",
    rules: { F: "F[+F]F[-F]F" },
    iterations: 4,
    angleDegrees: 25.7,
    stepLength: 4,
  },
  weed: {
    axiom: "F",
    rules: { F: "F[+F][-F]F" },
    iterations: 3,
    angleDegrees: 20,
    stepLength: 6,
  },
};

export function generateFoliagePreset(
  name: string,
  overrides: Partial<LSystemSpec> = {},
): FoliageResult {
  const preset = FOLIAGE_PRESETS[name];
  if (!preset) {
    throw new Error(
      `CanvasLoop: unknown foliage preset "${name}". Available presets: ${Object.keys(FOLIAGE_PRESETS).join(", ")}.`,
    );
  }
  return generateFoliageSvg({ ...preset, ...overrides });
}
