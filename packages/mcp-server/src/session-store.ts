import { LoopController } from "canvasloop-core";

const DEFAULT_MAX_ITERATIONS = 5;

/**
 * One controller for the process's lifetime, backing `iterate_prose`.
 * Sessions are in-memory only and don't survive a server restart. That's
 * expected for v0.1, not a gap to fix.
 */
export const proseSessionStore = new LoopController<string[]>({
  defaultMaxIterations: DEFAULT_MAX_ITERATIONS,
});

/**
 * Separate instance backing `iterate_sprite`. A deliberately distinct
 * store from `proseSessionStore` so a prose and a sprite loop can reuse the
 * same `sessionId` string without colliding.
 */
export const spriteSessionStore = new LoopController<string[]>({
  defaultMaxIterations: DEFAULT_MAX_ITERATIONS,
});
