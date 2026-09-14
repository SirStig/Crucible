import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// `src/version.ts` and its compiled `dist/version.js` sit at the same depth
// below the package root, so "../package.json" resolves from either. Reading it
// at runtime keeps the CLI's --version and the MCP server's advertised version
// from drifting apart on release, which they already had.
const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf-8"),
) as { version: string };

export const VERSION: string = manifest.version;
