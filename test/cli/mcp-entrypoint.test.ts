import { spawn } from "node:child_process";
import { mkdtempSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it, expect, afterAll } from "vitest";

const bin = resolve(import.meta.dirname, "../../dist/cli/bin.js");
const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

/** Runs `<command> mcp`, sends one initialize request, resolves with the reply. */
function handshake(command: string): Promise<string> {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [command, "mcp"], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (chunk) => (out += String(chunk)));
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.0" },
        },
      }) + "\n",
    );
    setTimeout(() => {
      child.kill();
      resolvePromise(out);
    }, 3000);
  });
}

describe("crucible mcp", () => {
  it("serves MCP over stdio when run directly", async () => {
    expect(await handshake(bin)).toContain('"protocolVersion"');
  }, 10000);

  // npm installs `bin` as a symlink, so anything resolving paths from argv[1]
  // sees the link rather than the real file. This is the path `npx crucible mcp`
  // takes, and it silently served nothing when that distinction was mishandled.
  it("serves MCP when invoked through a symlink, as an installed bin is", async () => {
    const dir = mkdtempSync(join(tmpdir(), "crucible-bin-"));
    tempDirs.push(dir);
    const link = join(dir, "crucible");
    symlinkSync(bin, link);
    expect(await handshake(link)).toContain('"protocolVersion"');
  }, 10000);
});
